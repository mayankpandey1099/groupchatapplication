const User = require('../models/users');
const ChatHistory = require('../models/chat-history')
const Group = require('../models/groups')
const awsService = require('../services/awsservices');
const { Op } = require('sequelize');



// saving the chat history in the db
exports.saveChatHistory = async (request, response, next) => {
    try {
        const user = request.user;
        const { message, GroupId } = request.body;
        if (GroupId == 0) {
            await user.createChatHistory({
                message,
            })
        } else {
            await user.createChatHistory({
                message,
                GroupId,
            })
        }

        return response.status(200).json({ message: "Message saved to database succesfully" })

    } catch (error) {
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


// getting the User chat history from the db
exports.getUserChatHistory = async (request, response, next) => {
    try {
        const user = request.user;
        const chatHistories = await user.getChatHistories();
        return response.status(200).json({ chat: chatHistories, message: "User chat History Fetched" })

    } catch (error) {
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


//getting all the chat-histories related to all the users
exports.getAllChatHistory = async (request, response, next) => {
    try {
        const lastMessageId = request.query.lastMessageId || 0;
        const chatHistories = await ChatHistory.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'date_time']
                }
            ],
            order: [['date_time', 'ASC']],
            where: {
                GroupId: null,
                id: {
                    [Op.gt]: lastMessageId
                }
            }
        });
        const chats = chatHistories.map((ele) => {
            const user = ele.User;
            return {
                messageId: ele.id,
                message: ele.message,
                isImage: ele.isImage,
                name: user.name,
                userId: user.id,
                date_time: ele.date_time
            }
        })
        return response.status(200).json({ chats, message: "User chat History Fetched" })

    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


//getting current user
exports.getcurrentuser = async (request, response, next) => {
    const user = request.user;
    response.json({ userId: user.id ,user});
}


//getting all  the user except the current user
exports.getAlluser = async (request, response, next) => {
    try {
        const user = request.user;
        const users = await User.findAll({
            attributes: ['id', 'name', 'imageUrl'],
            where: {
                id: {
                    [Op.not]: user.id
                }
            }
        });
        return response.status(200).json({ users, message: "All users succesfully fetched" })

    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


//creating the group and making the user as admin and mapping the element changing to the valid form (int) and make the user id associated with group
exports.createGroup = async (request, response, next) => {
    try {
        const user = request.user;
        const { name, membersNo, membersIds } = request.body;
        const group = await user.createGroup({
            name,
            membersNo,
            AdminId: user.id
        })
        membersIds.push(user.id);
        await group.addUsers(membersIds.map((ele) => {
            return Number(ele)
        }));
        return response.status(200).json({ group, message: "Group is succesfylly created" })

    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


//updating the group with the user in it 
exports.updateGroup = async (request, response, next) => {
    try {
        const user = request.user;
        const { groupId } = request.query;
        const group = await Group.findOne({ where: { id: Number(groupId) } });
        const { name, membersNo, membersIds } = request.body;
        const updatedGroup = await group.update({
            name,
            membersNo,
            AdminId: user.id
        })
        membersIds.push(user.id);
        await updatedGroup.setUsers(null);
        await updatedGroup.addUsers(membersIds.map((ele) => {
            return Number(ele)
        }));
        return response.status(200).json({ updatedGroup, message: "Group is succesfylly updated" })

    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


// getting all the groups from the db
exports.getAllgroups = async (request, response, next) => {
    try {
        const groups = await Group.findAll();
        return response.status(200).json({ groups, message: "All groups succesfully fetched" })

    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


// get chat history related to the group
exports.getGroupChatHistory = async (request, response, next) => {
    try {
        const { groupId } = request.query;
        const chatHistories = await ChatHistory.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'date_time']
                }
            ],
            order: [['date_time', 'ASC']],
            where: {
                GroupId: Number(groupId),
            }
        });
        const chats = chatHistories.map((ele) => {
            const user = ele.User;
            return {
                messageId: ele.id,
                message: ele.message,
                isImage: ele.isImage,
                name: user.name,
                userId: user.id,
                date_time: ele.date_time
            }
        })
        return response.status(200).json({ chats, message: "User chat History Fetched" })

    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


// getting groups by their id
exports.getGroupbyId = async (request, response, next) => {
    try {
        const { groupId } = request.query;
        const group = await Group.findOne({ where: { id: Number(groupId) } });
        response.status(200).json({ group, message: "Group details succesfully fetched" })
    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


// getting all the groups related to the current user 
exports.getMygroups = async (request, response, next) => {
    try {
        const user = request.user;
        const groups = await user.getGroups();
        return response.status(200).json({ groups, message: "All groups succesfully fetched" })

    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}


// getting all the members of the group and transform the user data with attribute (namee, id) and sends the json response
exports.getGroupMembersbyId = async (request, response, next) => {
    try {
        const { groupId } = request.query;
        const group = await Group.findOne({ where: { id: Number(groupId) } });
        const AllusersData = await group.getUsers();
        const users = AllusersData.map((ele) => {
            return {
                id: ele.id,
                name: ele.name,
            }
        })

        response.status(200).json({ users, message: "Group members name succesfully fetched" })
    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}



//saving the images in the s3bucket and also adding the image to chat history related to the common group/ specific group 
exports.saveChatImages = async (request, response, next) => {
    try {
        const user = request.user;
        const image = request.file;
        const { GroupId } = request.body;
        const filename = `chat-images/group${GroupId}/user${user.id}/${Date.now()}_${image.originalname}`;
        const imageUrl = await awsService.uploadToS3(image.buffer, filename)
        if (GroupId == 0) {
            await user.createChatHistory({
                message: imageUrl,
                isImage: true
            })
        } else {
            await user.createChatHistory({
                message: imageUrl,
                GroupId,
                isImage: true
            })
        }

        return response.status(200).json({ message: "image saved to database succesfully" })

    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: 'Internal Server error!' })
    }
}

