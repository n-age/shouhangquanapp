// cloudfunctions/main/users.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * Handles user login. Creates a new user if one doesn't exist, otherwise returns existing user data.
 * @param {object} event - The event object, containing userInfo.
 */
async function login(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    try {
        const usersCollection = db.collection('Users');
        const userRecord = await usersCollection.where({ _openid: openid }).get();

        if (userRecord.data.length > 0) {
            // User exists, return user data
            return { success: true, message: 'Login successful', data: userRecord.data[0] };
        } else {
            // New user, create a record
            const newUser = {
                _openid: openid,
                nickName: '微信用户',
                avatarUrl: '', // Default avatar
                roles: ['user'],
                verifications: {
                    realName: { status: 'none' },
                    enterprise: { status: 'none' },
                    pilot: { status: 'none' }
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const addUserResult = await usersCollection.add({ data: newUser });
            return { success: true, message: 'Registration successful', data: { _id: addUserResult._id, ...newUser } };
        }
    } catch (e) {
        console.error('Error in login:', e);
        return { success: false, message: 'Database operation failed.', error: e.message };
    }
}

/**
 * Updates a user's profile information (e.g., nickname, avatar).
 * @param {object} event - The event object.
 * @param {object} event.payload - The user info to update.
 */
async function updateProfile(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { nickName, avatarUrl, gender } = event.payload;

    if (!nickName || !avatarUrl) {
        return { success: false, message: 'Nickname and avatar URL are required.' };
    }

    try {
        const res = await db.collection('Users').where({ _openid: openid }).update({
            data: {
                nickName: nickName,
                avatarUrl: avatarUrl,
                gender: gender,
                updatedAt: new Date()
            }
        });

        if (res.stats.updated === 0) {
            return { success: false, message: 'User not found or no changes made.' };
        }

        return { success: true, message: 'Profile updated successfully.' };
    } catch (e) {
        console.error('Error in updateProfile:', e);
        return { success: false, message: 'Database operation failed.', error: e.message };
    }
}

/**
 * Retrieves the public profile of a pilot.
 * @param {object} event - The event object.
 * @param {object} event.payload - Contains the pilot's user ID.
 * @param {string} event.payload.pilotId - The ID of the pilot to retrieve.
 */
async function getPilotProfile(event, context) {
    const { pilotId } = event.payload;
    if (!pilotId) {
        return { success: false, message: 'Pilot ID is required.' };
    }

    try {
        const userRes = await db.collection('Users').doc(pilotId).field({
            _openid: 0,
            balance: 0,
            roles: 0
        }).get();

        if (!userRes.data) {
            return { success: false, message: 'Pilot not found.' };
        }

        // You could aggregate more data here, like completed task count, ratings etc.

        return { success: true, data: userRes.data };
    } catch(e) {
         console.error('Error in getPilotProfile:', e);
        return { success: false, message: 'Database operation failed.', error: e.message };
    }
}


module.exports = {
  login,
  updateProfile,
  getPilotProfile,
};
