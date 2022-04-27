/*const Redis = require('ioredis');
const redis = new Redis({ host: 'redis',port: 6379});
module.exports = redis*/
/*const redis = require('redis');

const client = redis.createClient({host:'redisdb',port:6379});
client.on('error', (err) => console.log('Redis Client Error', err))
client.connect()
module.exports = client;
*/
//import { createClient } from 'redis';
const redis = require('redis');
const getConnection = async () => {

const client = redis.createClient({ url:"redis-19978.c275.us-east-1-4.ec2.cloud.redislabs.com:19978" })     

client.on('error', (err) => console.log('Redis Client Error', err))

await client.connect()
return client

// await client.set('key', 'value')
// const value = await client.get('key')
// console.log(value)
}

module.exports = {
getConnection,
}

/*             //({ url: 'redis://redis:6379' });
client.connect()
module.exports = client;
*/