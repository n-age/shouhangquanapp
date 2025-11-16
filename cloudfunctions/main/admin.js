// cloudfunctions/main/admin.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * Checks if the calling user is an admin.
 * @param {string} openid - The user's openid.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
async function checkIsAdmin(openid) {
  // In a real project, this should be a robust check against a user role database.
  const adminConfig = await db.collection('Config').doc('admin_users').get().catch(() => null);
  const adminList = adminConfig && adminConfig.data ? adminConfig.data.openids : [];

  const user = await db.collection('Users').where({ _openid: openid }).get();
  if (user.data.length > 0 && user.data[0].roles && user.data[0].roles.includes('admin')) {
    return true;
  }
  return adminList.includes(openid);
}

/**
 * Retrieves a list of all pending authentication requests.
 */
async function getReviewList(event, context) {
  const wxContext = cloud.getWXContext();
  const isAdmin = await checkIsAdmin(wxContext.OPENID);
  if (!isAdmin) {
    return { success: false, message: 'Permission denied.' };
  }

  try {
    const res = await db.collection('Authentications').aggregate()
      .match({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lookup({
        from: 'Users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      })
      .unwind('$userInfo') // Deconstructs the userInfo array
      .project({
        'userInfo.balance': 0, // Exclude sensitive fields
        'userInfo.openid': 0,
      })
      .end();

    return { success: true, data: res.list };
  } catch (e) {
    console.error('Error in getReviewList:', e);
    return { success: false, message: 'Database operation failed.', error: e.message };
  }
}

/**
 * Approves or rejects an authentication request.
 * @param {object} event - The event object containing payload.
 * @param {string} event.payload.authId - The ID of the authentication document.
 * @param {string} event.payload.status - The new status ('approved' or 'rejected').
 * @param {string} [event.payload.reason] - The reason for rejection.
 */
async function review(event, context) {
    const wxContext = cloud.getWXContext();
    const isAdmin = await checkIsAdmin(wxContext.OPENID);
    if (!isAdmin) {
        return { success: false, message: 'Permission denied.' };
    }

    const { authId, status, reason } = event.payload;
    if (!authId || !status) {
        return { success: false, message: 'Missing required parameters.' };
    }
    if (!['approved', 'rejected'].includes(status)) {
        return { success: false, message: 'Invalid status value.' };
    }

    const transaction = await db.startTransaction();
    try {
        const authDoc = transaction.collection('Authentications').doc(authId);
        const authRecord = await authDoc.get();

        if (!authRecord.data) {
            await transaction.rollback();
            return { success: false, message: 'Authentication record not found.' };
        }
        if (authRecord.data.status !== 'pending') {
            await transaction.rollback();
            return { success: false, message: 'This request has already been reviewed.' };
        }

        await authDoc.update({
            data: {
                status: status,
                rejectReason: reason || null,
                reviewedAt: new Date(),
                reviewer: wxContext.OPENID
            }
        });

        if (status === 'approved') {
            const userDoc = transaction.collection('Users').doc(authRecord.data.userId);
            const updateData = {};
            const authType = authRecord.data.type;

            const verificationField = `verifications.${authType}`;
            updateData[verificationField] = {
                status: 'approved',
                authId: authId,
                updatedAt: new Date()
            };

            await userDoc.update({ data: updateData });
        }

        await transaction.commit();
        return { success: true, message: 'Review completed successfully.' };
    } catch (e) {
        await transaction.rollback();
        console.error('Error in review transaction:', e);
        return { success: false, message: 'Transaction failed.', error: e.message };
    }
}


module.exports = {
  getReviewList,
  review
};
