const { Op } = require("sequelize");
const axios = require("axios").default;
const { RequestPost, RequestPostTags } = require("../models");
const { OK, INTERNAL_SERVER_ERROR, NOT_FOUND, BAD_REQUEST, CREATED } = require("../httpCodes");

const getRequest = async (req, res) => {
   if(req.params.requestId){
       const response = await RequestPost.findOne({where: {requestId: req.params.requestId}});
       if (response) {
           res.json(response);
       } else {
           res.sendStatus(NOT_FOUND);
       }
   } else {
       res.sendStatus(INTERNAL_SERVER_ERROR);
   }
}

const getAllRequests = async (req, res) => {
    const response = await RequestPost.findAll();
    if (response) {
        res.status(OK).json(response);
    } else {
        res.sendStatus(NOT_FOUND);
    }
}

const getAllUserRequests = async (req, res) => {
    if (req.params.userId) {
        const response = await RequestPost.findAll({where: {userId: req.params.userId}});
        if (response) {
            res.status(OK).json(response);
        } else {
            res.sendStatus(NOT_FOUND)
        }
    } else {
        res.status(INTERNAL_SERVER_ERROR);
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
                    userId: similarPosts[i].dataValues.userId,
                    requestId: similarPosts[i].dataValues.requestId,
                    title: similarPosts[i].dataValues.title,
                    description: similarPosts[i].dataValues.description,
                    currentLocation: similarPosts[i].dataValues.currentLocation,
                    status: similarPosts[i].dataValues.status
                });
            }
        } else {
            const res = await axios.get(`${process.env.RECOMMENDATION_URL}/request/${req.params.title}`);
            if (res.length) {
                const resolved = await Promise.all(res.map(async r => {
                    const item = await RequestPost.findOne({ where: { requestId: r.postId }});
                    const { userId, requestId, title, description, status, requestTags } = item.dataValues;
                    return {
                        userId,
                        requestId,
                        title,
                        description,
                        currentLocation,
                        status,
                        requestTags
                    };
                }));

                response = response.concat(resolved);
            }
        }

        res.status(OK).json(response);

    } catch (error) {
        console.log("Error with searching for request posts: " + error);
        res.sendStatus(INTERNAL_SERVER_ERROR);
    }
}

const searchRequestsWithTags = async (req, res) => {
    if (req.body.tagList) {
        const tagList = req.body.tagList;
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
            where: {requestId: uniquePostIds}
        });

        const result = postList.map(post => {
            return post.dataValues;
        })

        res.status(OK).json({results: result});
    } else {
      res.sendStatus(BAD_REQUEST);
    }
}

// const createOffer = async (req, res) => {
//     const hasAllFields = req.body.userId && req.body.title && req.body.description && req.body.quantity && req.body.pickUpLocation && req.body.image && req.body.status && req.body.bestBeforeDate && req.body.tagList;
//     const validDate = req.body.bestBeforeDate.length == 10;
//     const validImage = req.body.image.includes(".com");
//     if(hasAllFields && validImage && validDate) {
//         const createdOffer = await OfferPost.create({
//             userId: req.body.userId,
//             title: req.body.title,
//             description: req.body.description,
//             quantity: req.body.quantity,
//             pickUpLocation: req.body.pickUpLocation,
//             image: req.body.image,
//             status: req.body.status,
//             bestBeforeDate: req.body.bestBeforeDate
//         });

//         let tagList = req.body.tagList;
//         if(tagList != null){
//             for(let item of tagList) {
//                 OfferPostTags.create({
//                     postId: createdOffer.offerId,
//                     name: item
//                 });
//             }
//             }

//         const updateUserBody = {
//             userId: req.body.userId,
//             offerPosts: 1,
//             requestPosts: 0,
//         };

//         await axios.put(`${process.env.USER_URL}/rank`, updateUserBody);
//         res.sendStatus(CREATED);

//     } else {
//         res.sendStatus(BAD_REQUEST);
//     }
// }

const createRequest = async (req, res) => {
    const hasAllFields = req.body.userId && req.body.title && req.body.description && req.body.currentLocation && req.body.status && req.body.tagList;
    if(hasAllFields) {
        const createdRequest = await RequestPost.create({
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.description,
            currentLocation: req.body.currentLocation,
            status: req.body.status
          });

        let tagList = req.body.tagList;
        if (tagList != null) {
            for(let item of tagList) {
                RequestPostTags.create({
                    postId: createdRequest.requestId,
                    name: item
                  });
            }
        }
        const updateUserBody = {
            userId: req.body.userId,
            offerPosts: 0, //BUG ALERT, what if they already made a bunch of offer posts and this is their first request post?
            requestPosts: 1,
        };
        await axios.put(`${process.env.USER_URL}/rank`, updateUserBody);
        res.sendStatus(CREATED);
    } else {
      res.sendStatus(BAD_REQUEST);
    }
}

/**
 * 
 * const createOffer = async (req, res) => {
    if(req.body.tagList) {
        const createdOffer = await OfferPost.create({
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.description,
            quantity: req.body.quantity,
            pickUpLocation: req.body.pickUpLocation,
            image: req.body.image,
            status: req.body.status,
            bestBeforeDate: req.body.bestBeforeDate
        });

        let tagList = req.body.tagList;
        if(tagList != null){
            for(let item of tagList) {
                OfferPostTags.create({
                    postId: createdOffer.offerId,
                    name: item
                });
            }
            }

        const updateUserBody = {
            userId: req.body.userId,
            offerPosts: 1,
            requestPosts: 0,
        };

        await axios.put(`${process.env.USER_URL}/rank`, updateUserBody);
        res.sendStatus(OK);

    } else {
        console.log("Error creating a new post: " + error);
        res.sendStatus(INTERNAL_SERVER_ERROR);
    }} 
 * 
 */

const updateRequest = async (req, res) => {
    if(req.body.requestId) {
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
                await axios.delete(`${process.env.RECOMMENDATION_URL}/suggestedPosts/request/${req.body.requestId}`);
            }
            res.status(OK).json("Post updated");
        }else{
            res.status(NOT_FOUND).json("You cannot update a post that does not exist");
        }
    } else {
      console.log("Error updating post: " + error);
      res.sendStatus(INTERNAL_SERVER_ERROR);
    }

}

const removeRequestTags = async (req, res) => {
    if(req.body.requestId) {
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
        res.sendStatus(OK);
    } else {
        console.log("Error deleting offer tags: " + error);
        res.sendStatus(INTERNAL_SERVER_ERROR);
    }
}

const addRequestTags = async (req, res) => {
    if(req.body.requestId) {
        const currentTags = await RequestPostTags.findAll({where: {postId: req.body.requestId}});

        const updatedTags = req.body.tagList;
        const currentTagsList = currentTags.map(tag => tag.dataValues.name);

        updatedTags.forEach(tag => {
            if (!currentTagsList.includes(tag)) {
                RequestPostTags.create({
                    postId: req.body.requestId,
                    name: tag
                });
            }
        });
        res.sendStatus(OK);
    } else {
        console.log("Error with adding new offer tags: " + error);
        res.sendStatus(INTERNAL_SERVER_ERROR);
    }
}

const deleteRequest = async (req, res) => {
    if(req.body.requestId) {
        await RequestPostTags.destroy({where: {postId: req.body.requestId}});
        await RequestPost.destroy({where: {requestId: req.body.requestId}});
        await axios.delete(`${process.env.RECOMMENDATION_URL}/suggestedPosts/request/${req.body.requestId}`);
        res.sendStatus(OK);
    } else {
        console.log("Error deleting post: " + error);
        res.sendStatus(INTERNAL_SERVER_ERROR);
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
  