const mongoose = require('mongoose')
const redis = require('redis');
const util = require('util');
require('../config/keys');

const client = redis.createClient(redisUrl);
client.hget = util.promisify(client.hget);


const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}){
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || 'default');
    return this;
}

mongoose.Query.prototype.exec = async function(){
    if(!this.useCache){
        const result = await exec.apply(this, arguments);
        return result;
    }
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));
    const cachedValue = await client.hget(this.hashKey, key);
    if(cachedValue){
        const doc = JSON.parse(cachedValue);
        console.log("I am not tool");
        return Array.isArray(doc) ? doc.map(d => new this.model(d)): new this.model(doc);
    }
    console.log("I am not fool");
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    client.expire(this.hashKey,20)
    return result;
}

function clearHash(hashKey){
    client.del(JSON.stringify(hashKey));
}

module.exports = {
    clearHash
}