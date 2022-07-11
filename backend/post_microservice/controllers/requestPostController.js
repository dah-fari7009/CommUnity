const { Op } = require("sequelize");
const axios = require("axios").default;
const { RequestPost, RequestPostTags } = require("../models");

const getRequest = async (req, res) => {
   try {
       const requestId = req.params.requestId;
       const response = await RequestPost.findOne({where: {requestId: requestId}});
       res.json(response);
   } catch (error) {
       console.log("Error finding an offer post: " + error);
   }
}

const getAllRequests = async (req, res) => {
    try {
        const response = await RequestPost.findAll();
        res.json(response);
    } catch (error) {
        console.log("Error getting all of the offer posts: " + error);
    }
}

const getAllUserRequests = async (req, res) => {
    try{
        const response = await RequestPost.findAll({where: {userId: req.params.userId}});
        res.json(response);
    } catch(error) {
        console.log("Error in retrieving request posts made by user " + error);
    }
}

const searchRequests = async (req, res) => {
    const title = req.params.title
    try {
        let response = [];

        const similarPosts = await RequestPost.findAll({
            where: {
                [Op.or]: [
                    {title: {[Op.like]: "%"+title+"%"}, 
                    status: "Active"},
                    {description: {[Op.like]: "%"+title+"%"}, 
                    status: "Active"}
                ]
            }
        });

        if (similarPosts != null){
            for (let i = 0; i < similarPosts.length; i = i + 1){
                response.push({
                    requestId: similarPosts[i].dataValues.requestId,
                    title: similarPosts[i].dataValues.title,
                    description: similarPosts[i].dataValues.description,
                    currentLocation: similarPosts[i].dataValues.currentLocation,
                    status: similarPosts[i].dataValues.status,
                    createdAt: similarPosts[i].dataValues.createdAt,
                });
            }
        }

        res.json(response);

    } catch (error) {
        console.log("Error with searching for offer posts: " + error);
        res.sendStatus(500);
    }
}

const searchRequestsWithTags = async (req, res) => {
    try {
        const tagList = req.params.tagList;
        const postTags = await RequestPostTags.findAll({
            where: {name: tagList}
        });
        
        let uniquePostIds = [];
        let duplicateRequestTagIds = [];
        for (let i = 0; i < postTags.length; i = i + 1){
            if (uniquePostIds.includes(postTags[i].dataValues.postId)){
                duplicateRequestTagIds.push(postTags[i].dataValues.offerId);
            } else {
                uniquePostIds.push(postTags[i].dataValues.postId);
            }
        }
        
        const postList = await RequestPost.findAll({
            where: {offerId: uniquePostIds}
        });

        res.status(200).json(postList);
    } catch (error) {
      console.log("Error with searching for offer posts: " + error);
      res.sendStatus(500);
    }
}

const createRequest = async (req, res) => {
    try {
        const createdRequest = await RequestPost.create({
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.description,
            status: req.body.status
          });

        let tagList = req.body.tagList;
        if (tagList) {
            for(let item of tagList) {
                RequestPostTags.create({
                    postId: createdRequest.dataValues.requestId,
                    name: item
                  });
            }
        }
          res.json(createdRequest);
    } catch (error) {
      console.log("Error creating a new post: " + error);
      res.sendStatus(500);
    }
}

const updateRequest = async (req, res) => {
    try {
        const updateRequest = RequestPost.findOne({
            where: {requestId: req.body.requestId}
        });
        const requestAlreadyExists = updateRequest != null;
        if(requestAlreadyExists){
            await RequestPost.update({
                userId: req.body.userId,
                title: req.body.title,
                description: req.body.description,
                currentLocation: req.body.currentLocation,
                status: req.body.status
            }, {where: {requestId: req.body.requestId}});
            if (req.body.status == "Fulfilled") {
                await axios.delete(`http://ec2-35-183-145-212.ca-central-1.compute.amazonaws.com:3000/suggestedPosts/request/${req.body.requestId}`);
            }
            res.json("Post updated");
        }else{
            res.json("You cannot update a post that does not exist");
        }
    } catch (error) {
      console.log("Error updating post: " + error);
      res.sendStatus(500);
    }

}

const removeRequestTags = async (req, res) => {
    try {
        const currentTags = await RequestPostTags.findAll({
            where: {postId: req.body.requestId}
        });
        const updatedTags = req.body.tagList;

        for (let i = 0; i < currentTags.length; i = i + 1){
            if (!(updatedTags.includes(currentTags[i].dataValues.name))) {
                RequestPostTags.destroy({
                    where: {
                        postId: req.body.requestId,
                        name: currentTags[i].dataValues.name
                    }
                });
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.log("Error deleting offer tags: " + error);
        res.sendStatus(500);
    }
}

const addRequestTags = async (req, res) => {
    try {
        const currentTags = await RequestPostTags.findAll({where: {postId: req.body.requestId}});

        const updatedTags = req.body.tagList;
        const currentTagsList = currentTags.map(tag => tag.dataValues.name);

        updatedTags.forEach(tag => {
            if (!currentTagsList.includes(tag)) {
                OfferPostTags.create({
                    postId: req.body.offerId,
                    name: tag
                });
            }
        });
        res.sendStatus(200);
    } catch (error) {
        console.log("Error with adding new offer tags: " + error);
        res.sendStatus(500);
    }
}

const deleteRequest = async (req, res) => {
    try {
        await RequestPostTags.destroy({where: {postId: req.body.requestId}});
        await RequestPost.destroy({where: {requestId: req.body.requestId}});
        await axios.delete(`http://ec2-35-183-145-212.ca-central-1.compute.amazonaws.com:3000/suggestedPosts/request/${req.body.requestId}`);
        res.sendStatus(200);
    } catch (error) {
        console.log("Error deleting post: " + error);
        res.sendStatus(500);
    }
}

module.exports = {
  getRequest,
  getAllRequests,
  getAllUserRequests,
  searchRequests,
  searchRequestsWithTags,
  createRequest,
  updateRequest,
  removeRequestTags,
  addRequestTags,
  deleteRequest
};
  