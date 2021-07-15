'use strict'

// libraries requires
const mongoose = require('mongoose');

// local requires
const FillByFilters = require('../data/advertsFinders/advertsFillByFilters');

const advertSchema = mongoose.Schema({
    name: {
        type: String,
        index: true
    },
    status: {
        type: Number,
        index: true
    },
    price: {
        type: Number,
        index: true
    },
    photo: String,
    tags: {
        type: Array,
        index: true
    }
});

// Enum for status
const statusEnum = {
    0: "On Sale",
    1: "Wanted",
    2: "Reserved",
    3: "Sold"
};

// get adverts by filters
advertSchema.methods.fillByFilters = async function (name, status, minPrice, maxPrice, tags, skip, limit, sort) {
    const filters = await FillByFilters(name, parseInt(status), minPrice, maxPrice, tags);
    
    const query = Advert.find(filters);
    query.limit(parseInt(limit));
    query.skip(parseInt(skip));
    query.sort(sort);
    return query.exec();
};

const Advert = mongoose.model('Advert', advertSchema);

module.exports = Advert;