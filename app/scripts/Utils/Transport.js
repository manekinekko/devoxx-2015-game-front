/* jshint devel:true */
/* globals RPG,Stomp,SockJS */
/**
 * Transport module.
 * @type {Class}
 * @author Wassim Chegham
 */
RPG.module('Transport', function() {
  
  'use strict';

  var connectTimer = null;
  var reconnections = 0;

  function onClose() {
    /*jshint validthis:true */

    this.socket.close();
    this.client.disconnect();
    this.pubsub.publish('/transport/connecting');
    this.reconnect();
  }

  function onGameSelected(topic, data) {
    /*jshint validthis:true */

    RPG.config.game = data;

    if(reconnections===0){

      // auto subscriptions
      Object.keys(RPG.config.topics).forEach(function(topic) {
        var serverTopic = RPG.config.topics[topic];
        if (topic.startsWith('SUB_')) {
          serverTopic = computeTopic(serverTopic);
          this.subscribe(serverTopic);
        } else if (topic.startsWith('PUB_')) {
          this.pubsub.subscribe(serverTopic, this.send.bind(this));
        }
      }.bind(this));
      handleServerErrors.call(this);
      handleAnimationTopics.call(this);

    }
  }

  function onConnect() {
    /*jshint validthis:true */

    clearInterval(connectTimer);
    this.pubsub.publish('/transport/connected');    
    this.subscribe(RPG.config.topics.SUB_ME_GAME_SELECTED, onGameSelected.bind(this));
    this.send(RPG.config.topics.PUB_GAME_SELECT);
  }

  function uncomputeTopic(topic) {
    if (topic.indexOf('game-') !== -1) {
      topic = topic.replace(/game-\d+/, '{gameId}');
    }
    return topic;
  }

  function computeTopic(topic) {
    if (topic.indexOf('{gameId}') !== -1) {
      topic = topic.replace('{gameId}', RPG.config.game.id);
    }
    return topic;
  }

  function handleServerErrors() {
    /*jshint validthis:true */

    this.subscribe(RPG.config.topics.SUB_ERROR_GLOBAL, function(topic, data) {
      console.error('Transport::SUB_ERROR_GLOBAL', JSON.stringify(data));
    });
    this.subscribe(RPG.config.topics.SUB_ME_ERROR_LOCAL, function(topic, data) {
      console.error('Transport::SUB_ME_ERROR_LOCAL', JSON.stringify(data));
    });
    this.subscribe(RPG.config.topics.SUB_MESSAGE_GLOBAL, function(topic, data) {
      console.error('Transport::SUB_MESSAGE_GLOBAL', JSON.stringify(data));
    });
  }

  function handleAnimationTopics(){
    /*jshint validthis:true */

    this.subscribe(RPG.config.topics.SUB_ANIMATION_ALL);
    this.send(RPG.config.topics.PUB_ANIMATION_ALL);
  }

  function Transport(PubSub) {
    /*jshint validthis:true */

    this.pubsub = PubSub;
  }
  Transport.prototype.initialize = function() {
    this.socket = new SockJS(RPG.config.socket.url);
    this.client = Stomp.over(this.socket);
    this.client.connect({}, onConnect.bind(this), onClose.bind(this));
    
    if(RPG.config.debug.transport === false){
      this.client.debug =  null;
    }
  };
  Transport.prototype.subscribe = function(topic, callback) {
    this.client.subscribe(topic, function(data) {
      
      try{
        data = JSON.parse(data.body || data);
      }
      catch(e){
        console.error('Transport::ParseError', 'can not parse server message', data);
      }

      topic = uncomputeTopic(topic);
      this.pubsub.publish(topic, data);
      if (callback && callback.call) {
        callback(topic, data);
      }

    }.bind(this));
  };
  Transport.prototype.send = function(topic, data) {
    topic = computeTopic(topic);
    this.client.send(topic, {}, JSON.stringify(data));
  };
  Transport.prototype.reconnect = function(){
    connectTimer = setTimeout(function(){
      reconnections++;
      this.initialize();
    }.bind(this), 3000);
  };
  return Transport;
});