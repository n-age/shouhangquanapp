// cloudfunctions/main/users.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function login(event, context) {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    try {
        const usersCollection = db.collection('Users');
        const userRecord = await usersCollection.where({ _openid: openid }).get();

        if (userRecord.data.length > 0) {
            return { success: true, message: 'Login successful', data: userRecord.data[0] };
        } else {
            const newUser = {
                _openid: openid,
                nickName: '微信用户',
                avatarUrl: '',
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
