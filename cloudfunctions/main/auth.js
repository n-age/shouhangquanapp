// cloudfunctions/main/auth.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * A generic function to submit an authentication request.
 * @param {string} userId - The internal user ID.
 * @param {string} type - The type of authentication ('realName', 'enterprise', 'pilot').
 * @param {object} data - The data specific to the authentication type.
 * @returns {object} - An object indicating success or failure.
 */
async function submitAuth(userId, type, data) {
  try {
    // Check for an existing pending request of the same type for this user
    const existingAuth = await db.collection('Authentications').where({
      userId: userId,
      type: type,
      status: 'pending'
    }).count();

    if (existingAuth.total > 0) {
      return { success: false, message: 'You already have a pending request of this type.' };
    }

    // Create a new authentication record
    await db.collection('Authentications').add({
      data: {
        userId: userId,
        type: type,
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return { success: true, message: 'Your application has been submitted successfully.' };
  } catch (e) {
    console.error(`Error in submitAuth for type ${type}:`, e);
    return { success: false, message: 'Database operation failed.', error: e.message };
  }
}

/**
 * Handles the submission of real name verification.
 * @param {object} event - The event object.
 * @param {object} event.payload - The data for the request.
 */
async function submitRealName(event, context) {
  const wxContext = cloud.getWXContext();
  const { realName, idCardNumber, idCardImageUrl } = event.payload;

  if (!realName || !idCardNumber || !idCardImageUrl) {
    return { success: false, message: 'Missing required fields for real name authentication.' };
  }

  return await submitAuth(wxContext.OPENID, 'realName', { realName, idCardNumber, idCardImageUrl });
}

/**
 * Handles the submission of enterprise verification.
 * @param {object} event - The event object.
 * @param {object} event.payload - The data for the request.
 */
async function submitEnterprise(event, context) {
  const wxContext = cloud.getWXContext();
  const { enterpriseName, creditCode, licenseUrl } = event.payload;

  if (!enterpriseName || !creditCode || !licenseUrl) {
    return { success: false, message: 'Missing required fields for enterprise authentication.' };
  }

  return await submitAuth(wxContext.OPENID, 'enterprise', { enterpriseName, creditCode, licenseUrl });
}

/**
 * Handles the submission of pilot verification.
 * @param {object} event - The event object.
 * @param {object} event.payload - The data for the request.
 */
async function submitPilot(event, context) {
  const wxContext = cloud.getWXContext();
  const { certificateType, certificateNumber, certificateUrl } = event.payload;

  if (!certificateType || !certificateNumber || !certificateUrl) {
    return { success: false, message: 'Missing required fields for pilot authentication.' };
  }

  return await submitAuth(wxContext.OPENID, 'pilot', { certificateType, certificateNumber, certificateUrl });
}

/**
 * Retrieves the user's current authentication status for all types.
 */
async function getAuthStatus(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    try {
        const userResult = await db.collection('Users').where({ _openid: openid }).limit(1).get();
        if (userResult.data.length === 0) {
            return { success: false, message: 'User not found.' };
        }
        const user = userResult.data[0];

        // Also fetch the latest pending or rejected requests for more context
        const authRequests = await db.collection('Authentications')
            .where({ userId: user._id })
            .orderBy('createdAt', 'desc')
            .get();

        const status = {
            realName: { status: 'none' },
            enterprise: { status: 'none' },
            pilot: { status: 'none' }
        };

        authRequests.data.forEach(req => {
            if (status[req.type].status === 'none' || status[req.type].status === 'rejected') {
                 status[req.type] = {
                    status: req.status,
                    reason: req.rejectReason || null
                };
            }
        });

        // If user record shows verified, it overrides any other status
        if (user.verifications?.realName?.status === 'approved') {
            status.realName.status = 'approved';
        }
         if (user.verifications?.enterprise?.status === 'approved') {
            status.enterprise.status = 'approved';
        }
         if (user.verifications?.pilot?.status === 'approved') {
            status.pilot.status = 'approved';
        }


        return { success: true, data: status };

    } catch (e) {
        console.error('Error in getAuthStatus:', e);
        return { success: false, message: 'Database error.', error: e.message };
    }
}


module.exports = {
  submitRealName,
  submitEnterprise,
  submitPilot,
  getAuthStatus
};
