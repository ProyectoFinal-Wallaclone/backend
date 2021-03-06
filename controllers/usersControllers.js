'use strict';

// local requires
const { User, Advert } = require('../models');
const { deleteMultipleImages, deleteSingleImage } = require('../libs/awsS3');

// libraries requires
require('dotenv');
const mongoose = require('mongoose');

class UsersController {

    /**
     * GET /:username
     */
    async getUserAndAdverts(req, res, next) {
        try {
            const user = req.params.nickname;

            const { name, nickname, description, photo, province, _id } = await User.findOne({nickname: user})
            const userData = { nickname, description, photo, province };

            const userAdverts = await Advert.find({ userId: _id });

            res.status(200).json({ result: {
                user: userData,
                adverts: userAdverts
            }});
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /
     */
    async getUser(req, res, next) {
        const userId = req.apiAuthUserId;
        try {
            const { name, photo, nickname, province, description } = await User.findById({_id: userId});
            const userNoPassword = { name, photo, nickname, province, description };

            res.status(200).json({ result: userNoPassword });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * DELETE /
     */
    async deleteUser(req, res, next) {
        
        try {
            const userId = req.apiAuthUserId;

            await User.deleteOne({ _id: userId });
    
            /// TODO:  Añadir notificación de aviso para usuarios de que determinado producto ha desaparecido de sus favoritos
            /// TODO:  Sacar esta operación fuera para evitar que la app se quedé colgada en este punto
            const advertsToDelete = await Advert.find({ userId: { $in: userId }});
            const advertsIds = advertsToDelete.map( advert => advert._id.toString()); 
            const usersRemoveFavorites = await User.find({ favorites: { $in: advertsIds  }}); 

            if(usersRemoveFavorites.length !== 0) {
                advertsIds.forEach(advert => {
                    usersRemoveFavorites.forEach(async favorite => {
                        const index = favorite.favorites.indexOf(advert);
                        if (index > -1) {
                            favorite.favorites.splice(index, 1);
                            await favorite.save();
                        }
                    });
                });
            }
    
            // Borramos todos los anuncios de ese usuario
            await Advert.deleteMany({ userId: { $in: userId } });

            // TODO: Hay que borrar las imagenes asociadas a esos anuncios en S3

            res.status(200).json( {
                result: "Delete user succesfuly",
                user: userId,
                related_Ads: advertsToDelete,
                remove_from_favs: `${usersRemoveFavorites.length} times`
            });
        } catch (error) {
            res.status(500).json({ message: error.message });    
        }
    }

    /**
     * UPDATE /
     */
    async updateUser(req, res, next) {
        const file = req.file;
        const data = req.body;
        const authUserId = req.apiAuthUserId;
        const filter = { _id: authUserId };

        try {     
            
            if (file) {
                data.photo = [];
                data.photo.push(file.originalname);
            }

            const updateUser = await User.findOneAndUpdate(filter, data, {
                new: true
            });
            res.status(201).json({ result: updateUser });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * POST /userimage
     */
    async uploadUserImage (req, res, next) {
        const authUserId = req.apiAuthUserId;
        const filter = { _id: authUserId };
        const file = req.file;

        try {        
            const updateUserImage = await User.findById(filter);
            if (file) {
                updateUserImage.photo.push(file.originalname);
            }
            updateUserImage.save();
            res.status(201).json({ result: updateUserImage });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /getUserImage
     */
    async getUserImage (req, res, next) {
        const authUserId = req.apiAuthUserId;
        const filter = { _id: authUserId };

        try {
            const imageUser = await User.findById(filter);
            res.status(201).json({ result: imageUser.photo[0]})
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new UsersController();