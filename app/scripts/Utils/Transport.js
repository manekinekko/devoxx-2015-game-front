/* jshint devel:true */
/* globals RPG */
/**
 * Transport module.
 * @type {Class}
 * @author Wassim Chegham
 */
RPG.module('Transport', function() {
  'use strict';

  function Transport(PubSub) {
    this.pubsub = PubSub;
    this.client = Stomp.over(new SockJS('http://localhost:8080/game'));
    this.client.connect({}, this.onConnection.bind(this));
  }
  Transport.prototype.onConnection = function() {
    // subscriptions
    for (var topic in Transport.prototype) {
      if (Transport.prototype.hasOwnProperty(topic)) {
        this.client.subscribe(topic, function(data) {
          console.log(topic, data);
          Transport.prototype[topic].call(this, data);
          this.pubsub.publish(topic);
        }.bind(this));
      }
    }
    // publishes
    this.pubsub.subscribe('/topic/game/player/join', this.send.bind(this));
    this.pubsub.subscribe('/topic/game/player/quit', this.send.bind(this));
  }
  Transport.prototype.send = function(topic, data) {
      this.client.send(topic, {}, JSON.stringify(data));
    }
    // topics implementation 
  Transport.prototype[RPG.topics.PUB_PLAYER_JOIN] = function(topic) {}
  Transport.prototype[RPG.topics.PUB_PLAYER_LEAVE] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_DIED] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_REVIVED] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_HIT] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_HEALED] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_STATES] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_LIFE] = function(topic) {}
  Transport.prototype[RPG.topics.PUB_PLAYER_MOVE_UP] = function(topic) {}
  Transport.prototype[RPG.topics.PUB_PLAYER_MOVE_DOWN] = function(topic) {}
  Transport.prototype[RPG.topics.PUB_PLAYER_MOVE_LEFT] = function(topic) {}
  Transport.prototype[RPG.topics.PUB_PLAYER_MOVE_RIGHT] = function(topic) {}
  Transport.prototype[RPG.topics.PUB_ACTION] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_ACTION_IMAGE_MOVED] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_MOVED] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_JOINED] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_PLAYER_LEFT] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_ERROR_GLOBAL] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_MESSAGE_GLOBAL] = function(topic) {}
  Transport.prototype[RPG.topics.SUB_ERROR_LOCAL] = function(topic) {}
  return Transport;
});