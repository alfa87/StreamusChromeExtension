﻿define([
    'text!../template/createPlaylist.htm',
    'streamItems',
    'folders',
    'youTubeDataAPI',
    'dataSource'
], function (CreatePlaylistTemplate, StreamItems, Folders, YouTubeDataAPI, DataSource) {
    'use strict';

    var CreatePlaylistView = Backbone.View.extend({

        className: 'createPlaylist',

        template: _.template(CreatePlaylistTemplate),

        playlistTitleInput: null,
        youTubeSourceInput: null,

        events: {
            'input input.youTubeSource': 'processInput',
            'input input.playlistTitle': 'validateTitle'
        },

        render: function () {
            
            this.$el.html(this.template({
                'chrome.i18n': chrome.i18n,
                'playlistCount': Folders.getActiveFolder().get('playlists').length
            }));

            this.playlistTitleInput = this.$el.find('input.playlistTitle');
            this.youTubeSourceInput = this.$el.find('input.youTubeSource');

            return this;
        },

        validateTitle: function() {
            //  When the user submits - check to see if they provided a playlist name
            var playlistTitle = $.trim(this.playlistTitleInput.val());
            this.playlistTitleInput.toggleClass('invalid', playlistTitle === '');
        },
        
        //  Throttle for typing support
        processInput: _.throttle(function () {
            var self = this;
            
            //  Wrap in a setTimeout to let drop event finish (no real noticeable lag but keeps things DRY easier)
            setTimeout(function() {

                var youTubeSource = $.trim(self.youTubeSourceInput.val());
                self.youTubeSourceInput.data('datasource', '').removeClass('valid invalid');

                if (youTubeSource !== '') {
                    //  Check validity of URL and represent validity via invalid class.
                    var dataSource = YouTubeDataAPI.parseUrlForDataSource(youTubeSource);

                    console.log('parsed datasource:', dataSource);

                    self.youTubeSourceInput.data('datasource', dataSource);
                
                    switch (dataSource.type) {
                        case DataSource.YOUTUBE_PLAYLIST:

                            YouTubeDataAPI.getPlaylistTitle(dataSource.id, function (youTubePlaylistTitle) {
                                self.playlistTitleInput.val(youTubePlaylistTitle);
                                self.youTubeSourceInput.addClass('valid');
                            });

                            break;
                        case DataSource.YOUTUBE_CHANNEL:

                            YouTubeDataAPI.getChannelName(dataSource.id, function (channelName) {
                                self.playlistTitleInput.val(channelName + '\'s Feed');
                                self.youTubeSourceInput.addClass('valid');
                            });

                            break;
                            //  TODO: Need to support getting shared playlist information.
                            //case DataSource.SHARED_PLAYLIST:
                            //    self.model.addPlaylistByDataSource('', dataSource);
                            //    break;
                        case DataSource.YOUTUBE_FAVORITES:

                            YouTubeDataAPI.getChannelName(dataSource.id, function (channelName) {
                                self.playlistTitleInput.val(channelName + '\'s Feed');
                                self.youTubeSourceInput.addClass('valid');
                            });

                            break;
                        default:
                            //  Typing is invalid, but expected.
                            if (dataSource.type !== DataSource.USER_INPUT) {
                                console.error("Unhandled dataSource type:", dataSource.type);
                            }
                            
                            self.youTubeSourceInput.addClass('invalid');
                    }

                }
                
            });


        }, 100),
        
        validate: function () {

            //  If all submittable fields indicate themselves as valid -- allow submission.
            var valid = this.$el.find('.submittable.invalid').length === 0;

            console.log("Am I valid?", valid);

            return valid;
        },

        save: function () {
            console.log("Saving...");
            var activeFolder = Folders.getActiveFolder();

            var dataSource = this.youTubeSourceInput.data('datasource');
            var playlistName = $.trim(this.playlistTitleInput.val());
            console.log("DataSource:", dataSource);
            if (dataSource != '') {
                
                activeFolder.addPlaylistByDataSource(playlistName, dataSource);
            } else {

                if (!this.model || this.model.length === 0) {
                    activeFolder.addEmptyPlaylist(playlistName);
                } else {
                    activeFolder.addPlaylistWithVideos(playlistName, this.model);
                }

            }
        }
        

    });

    return CreatePlaylistView;
});