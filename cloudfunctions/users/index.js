// cloudfunctions/users/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, params } = event;

  switch (action) {
    case 'login':
      return await login(openid, event.userInfo);
    case 'updateProfile':
      return await updateProfile(openid, event.userInfo);
    case 'getPilotProfile':
      return await getPilotProfile(params.pilotId);
    default:
      return { errCode: 404, errMsg: 'Action not found' };
  }
};

/**
 * Gets a pilot's public profile information.
 * @param {string} pilotId - The _id of the pilot user.
 */
async function getPilotProfile(pilotId) {
  if (!pilotId) {
    return { errCode: 1, errMsg: 'pilotId is required' };
  }

  try {
    const usersCollection = db.collection('Users');
    const tasksCollection = db.collection('Tasks');
    const _ = db.command;

    // 1. Get user's public info
    const userRes = await usersCollection.doc(pilotId).field({
      _openid: 0, // Exclude sensitive info
      balance: 0,
    }).get();

    if (!userRes.data) {
      return { errCode: 2, errMsg: 'Pilot not found' };
    }

    const pilotProfile = userRes.data;

    // 2. Get completed tasks as portfolio
    const tasksRes = await tasksCollection.where({
      publisherId: pilotId, // This should be pilotId in a real scenario
      status: 'completed'
    })
    .orderBy('createdAt', 'desc')
    .limit(5) // Get latest 5 completed tasks
    .get();

    // In a real app, stats would be calculated or stored separately
    pilotProfile.stats = {
        flightHours: '1200+',
        completedTasks: tasksRes.data.length,
        rating: '4.9'
    };

    pilotProfile.completedMissions = tasksRes.data.map(task => ({
      id: task._id,
      title: task.title,
      imageUrl: task.coverImageUrl || '/static/images/mission-placeholder-1.png', // Assuming tasks have images
      date: new Date(task.createdAt).toLocaleDateString(),
      location: task.address
    }));

    // Mocked skills for now
    pilotProfile.skills = ['商业航拍', '农业植保', '测绘与建模', 'FPV'];

    return {
      errCode: 0,
      errMsg: 'Success',
      data: pilotProfile
    };

  } catch (e) {
    console.error('Error in getPilotProfile:', e);
    return { errCode: 500, errMsg: 'Database operation failed' };
  }
}

/**
 * Updates user profile (nickName, avatarUrl, etc.)
 * @param {string} openid - The user's openid.
 * @param {object} userInfo - The user info to update.
 */
async function updateProfile(openid, userInfo) {
  try {
    const usersCollection = db.collection('Users');
    const userRecord = await usersCollection.where({ _openid: openid }).get();

    if (userRecord.data.length === 0) {
      return { errCode: 1, errMsg: 'User not found' };
    }

    const userId = userRecord.data[0]._id;
    await usersCollection.doc(userId).update({
      data: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        gender: userInfo.gender,
        updatedAt: new Date()
      }
    });

    return { errCode: 0, errMsg: 'Profile updated successfully' };
  } catch (e) {
    console.error('Error in updateProfile:', e);
    return { errCode: 500, errMsg: 'Database operation failed' };
  }
}

/**
 * Handles user login. Creates a new user if one doesn't exist.
 * @param {string} openid - The user's openid.
 * @param {object} userInfo - User info from the client (e.g., nickName, avatarUrl).
 */
async function login(openid, userInfo) {
  try {
    const usersCollection = db.collection('Users');
    const userRecord = await usersCollection.where({ _openid: openid }).get();

    if (userRecord.data.length > 0) {
      // User exists, return user data
      const user = userRecord.data[0];
      // Optionally, update user info if it has changed
      // await usersCollection.doc(user._id).update({ data: { nickName: userInfo.nickName, avatarUrl: userInfo.avatarUrl } });
      return {
        errCode: 0,
        errMsg: 'Login successful',
        data: user
      };
    } else {
      // User does not exist, create a new user record
      const newUser = {
        _openid: openid,
        nickName: userInfo.nickName || '新用户',
        avatarUrl: userInfo.avatarUrl || '', // Add a default avatar path if you have one
        gender: userInfo.gender || 0,
        role: ['customer'], // Default role
        isRealNameVerified: false,
        isPilotVerified: false,
        isEnterpriseVerified: false,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const addUserResult = await usersCollection.add({
        data: newUser
      });
      return {
        errCode: 0,
        errMsg: 'Registration successful',
        data: { _id: addUserResult._id, ...newUser }
      };
    }
  } catch (e) {
    console.error('Error in login function:', e);
    return { errCode: 500, errMsg: 'Database operation failed' };
  }
}
