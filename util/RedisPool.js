var EventEmitter = require('events').EventEmitter;
var Util         = require('util');
var redis = require('redis');

module.exports = RedisPool;
function PoolConfig(options) {
  this.waitForConnections = (options.waitForConnections === undefined)
    ? true
    : Boolean(options.waitForConnections);
  this.connectionLimit    = (options.connectionLimit === undefined)
    ? 10
    : Number(options.connectionLimit);
  this.queueLimit         = (options.queueLimit === undefined)
    ? 0
    : Number(options.queueLimit);
	this.host  = (options.host === undefined) ? "localhost" : options.host;
	this.port = (options.port === undefined) ? 6379 : Number(options.port);
	this.connect_timeout = (options.connect_timeout === undefined) ? 1 : Number(options.connect_timeout);
}

Util.inherits(RedisPool, EventEmitter);
function RedisPool(option) {
  var options = new PoolConfig(option);	
  EventEmitter.call(this);
  this.config = options;

  this._allConnections   = [];
  this._freeConnections  = [];
  this._connectionQueue  = [];
  this._closed           = false;
}

RedisPool.prototype.getConnection = function (cb) {
	//console.log("--------get connection-------");
  if (this._closed) {
    return process.nextTick(function(){
      return cb(new Error('Pool is closed.'));
    });
  }

  var connection;
  // console.log("redis all connection : ", this._allConnections.length);
  // console.log("redis free connection : ", this._freeConnections.length);

  if (this._freeConnections.length > 0) {
	//console.log("redis shift free connection (before) : ", this._freeConnections.length);
    connection = this._freeConnections.shift();
	//console.log("redis shift free connection (after) : ", this._freeConnections.length);

    return process.nextTick(function(){
      return cb(null, connection);
    });
  }

  if (this.config.connectionLimit === 0 || this._allConnections.length < this.config.connectionLimit) {
    connection = new redis.createClientByPool(this, this.config);

    connection.on("connect",function(err) {
		if (this._closed) {
			return cb(new Error('Pool is closed.'));
		}
		if (err) {
			return cb(err);
		}

		this._allConnections.push(connection);
		this.emit('connection', connection);
		this._connectionQueue.push(cb);
		console.log("redis push connection queue : ", this._connectionQueue.length);
		return cb(null, connection);
    }.bind(this));
	
	connection.on("error", function(err){
		return cb(-1001);
	}.bind(this));
	
	connection.on("timeout", function(err){
		return cb(10053);
	}.bind(this));
	
	  //console.log("redis create connection : ", this._allConnections.length);		  
	return connection;
  }

  if (!this.config.waitForConnections) {
    return process.nextTick(function(){
      return cb(new Error('No connections available.'));
    });
  }

  if (this.config.queueLimit && this._connectionQueue.length >= this.config.queueLimit) {
    return cb(new Error('Queue limit reached.'));
  }
};

RedisPool.prototype.releaseConnection = function (connection) {
  var cb;
	//console.log("--------release connection-------");

  if (!connection._pool) {
    // The connection has been removed from the pool and is no longer good.
    if (this._connectionQueue.length) {
      cb = this._connectionQueue.shift();

      process.nextTick(this.getConnection.bind(this, cb));
    }
  } else if (this._connectionQueue.length) {
	//console.log("redis shift connection queue (pre) : ", this._connectionQueue.length);
    cb = this._connectionQueue.shift();

    process.nextTick(cb.bind(null, null, connection));
  } else {
	//console.log("redis push free connection (pre) : ", this._freeConnections.length);
    this._freeConnections.push(connection);
  }
	//console.log("redis release connection (all) : ", this._allConnections.length);
	//console.log("redis release connection (free) : ", this._freeConnections.length);
	//console.log("redis release connection (connection) : ", this._connectionQueue.length);
};

RedisPool.prototype.end = function (cb) {
  this._closed = true;

  if (typeof cb != "function") {
    cb = function (err) {
      if (err) throw err;
    };
  }

  var calledBack        = false;
  var closedConnections = 0;
  var connection;

  var endCB = function(err) {
    if (calledBack) {
      return;
    }

    if (err || ++closedConnections >= this._allConnections.length) {
      calledBack = true;
      delete endCB;
      return cb(err);
    }
  }.bind(this);

  if (this._allConnections.length === 0) {
    return endCB();
  }

  for (var i = 0; i < this._allConnections.length; i++) {
    connection = this._allConnections[i];
    connection._realEnd(endCB);
  }
};

RedisPool.prototype._removeConnection = function(connection) {
  var i;

  for (i = 0; i < this._allConnections.length; i++) {
    if (this._allConnections[i] === connection) {
      this._allConnections.splice(i, 1);
      break;
    }
  }

  for (i = 0; i < this._freeConnections.length; i++) {
    if (this._freeConnections[i] === connection) {
      this._freeConnections.splice(i, 1);
      break;
    }
  }

  this.releaseConnection(connection);
};

