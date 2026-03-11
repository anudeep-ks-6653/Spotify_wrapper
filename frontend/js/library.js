// Library module for My Playlists, Liked Songs, and Recently Played
const Library = {
    templates: {},
    currentPlaylistsPage: 0,
    currentLikedSongsPage: 0,
    playlistsLimit: 20,
    likedSongsLimit: 20,
    recentlyPlayedLimit: 50,
    recentlyPlayedIntervalId: null,
    RECENTLY_PLAYED_REFRESH_INTERVAL: 60 * 1000, // 1 minute in milliseconds
    isLoaded: {
        playlists: false,
        likedSongs: false,
        recentlyPlayed: false
    },

    init() {
        this.compileTemplates();
        this.bindEvents();
        console.log('Library module initialized');
    },

    compileTemplates() {
        const playlistTemplate = document.getElementById('library-playlist-template');
        const likedSongTemplate = document.getElementById('liked-song-template');
        const recentlyPlayedTemplate = document.getElementById('recently-played-template');

        if (playlistTemplate) {
            this.templates.playlist = Handlebars.compile(playlistTemplate.innerHTML);
        }
        if (likedSongTemplate) {
            this.templates.likedSong = Handlebars.compile(likedSongTemplate.innerHTML);
        }
        if (recentlyPlayedTemplate) {
            this.templates.recentlyPlayed = Handlebars.compile(recentlyPlayedTemplate.innerHTML);
        }

        // Register helpers if not already registered
        if (!Handlebars.helpers.truncate) {
            Handlebars.registerHelper('truncate', function(str, len) {
                if (!str) return '';
                if (str.length <= len) return str;
                return str.substring(0, len) + '...';
            });
        }
    },

    bindEvents() {
        // Tab switch events
        $('#playlists-tab-btn').on('shown.bs.tab', () => {
            if (!this.isLoaded.playlists) {
                this.loadMyPlaylists();
            }
        });

        $('#liked-songs-tab-btn').on('shown.bs.tab', () => {
            if (!this.isLoaded.likedSongs) {
                this.loadLikedSongs();
            }
        });

        $('#recently-played-tab-btn').on('shown.bs.tab', () => {
            if (!this.isLoaded.recentlyPlayed) {
                this.loadRecentlyPlayed();
            }
            this.startRecentlyPlayedAutoRefresh();
        });

        // Stop auto-refresh when switching away from recently played tab
        $('#playlists-tab-btn, #liked-songs-tab-btn').on('shown.bs.tab', () => {
            this.stopRecentlyPlayedAutoRefresh();
        });

        // Refresh button
        $('#refresh-recently-played').on('click', () => {
            this.isLoaded.recentlyPlayed = false;
            this.loadRecentlyPlayed();
            // Restart the interval timer after manual refresh
            this.startRecentlyPlayedAutoRefresh();
        });

        // Play buttons (delegated)
        $(document).on('click', '#my-playlists-list .play-playlist-btn', this.handlePlayPlaylist.bind(this));
        $(document).on('click', '#liked-songs-list .play-track-btn', this.handlePlayTrack.bind(this));
        $(document).on('click', '#recently-played-list .play-track-btn', this.handlePlayTrack.bind(this));
    },

    // Start auto-refresh for recently played (every 5 minutes)
    startRecentlyPlayedAutoRefresh() {
        // Clear any existing interval first
        this.stopRecentlyPlayedAutoRefresh();
        
        this.recentlyPlayedIntervalId = setInterval(() => {
            console.log('Auto-refreshing recently played...');
            this.loadRecentlyPlayed();
        }, this.RECENTLY_PLAYED_REFRESH_INTERVAL);
        
        console.log('Recently played auto-refresh started (every 5 minutes)');
    },

    // Stop auto-refresh for recently played
    stopRecentlyPlayedAutoRefresh() {
        if (this.recentlyPlayedIntervalId) {
            clearInterval(this.recentlyPlayedIntervalId);
            this.recentlyPlayedIntervalId = null;
            console.log('Recently played auto-refresh stopped');
        }
    },

    // Called when library tab is activated
    onTabActivated() {
        // Load playlists by default (first sub-tab)
        if (!this.isLoaded.playlists) {
            this.loadMyPlaylists();
        }
        // Start auto-refresh if recently played tab is active
        if ($('#recently-played-tab-btn').hasClass('active')) {
            this.startRecentlyPlayedAutoRefresh();
        }
    },

    // Called when library tab is deactivated (user switches to another main tab)
    onTabDeactivated() {
        this.stopRecentlyPlayedAutoRefresh();
    },

    // Load user's playlists
    async loadMyPlaylists(offset = 0) {
        if (!SpotifyAPI.userId) return;

        const $container = $('#my-playlists-list');
        const $pagination = $('#playlists-pagination');

        // Show loading
        $container.html(`
            <div class="col-12 text-center text-muted">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading your playlists...</p>
            </div>
        `);

        try {
            const response = await SpotifyAPI.getMyPlaylists(this.playlistsLimit, offset);

            this.currentPlaylistsPage = Math.floor(offset / this.playlistsLimit);
            this.displayPlaylists(response, $container, $pagination);
            this.isLoaded.playlists = true;

        } catch (error) {
            console.error('Error loading playlists:', error);
            $container.html(`
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load playlists. Please try again.
                    </div>
                </div>
            `);
        }
    },

    displayPlaylists(data, $container, $pagination) {
        $container.empty();
        $pagination.empty();

        if (!data.items || data.items.length === 0) {
            $container.html(`
                <div class="col-12 text-center text-muted">
                    <i class="fas fa-list display-4 mb-3"></i>
                    <p>No playlists found. Create some playlists in Spotify!</p>
                </div>
            `);
            return;
        }

        data.items.forEach(playlist => {
            const imageUrl = playlist.images && playlist.images.length > 0
                ? playlist.images[0].url
                : 'https://via.placeholder.com/64?text=No+Image';

            const templateData = {
                id: playlist.id,
                name: playlist.name,
                imageUrl: imageUrl,
                totalTracks: playlist.tracks?.total || 0,
                uri: playlist.uri
            };

            $container.append(this.templates.playlist(templateData));
        });

        // Add pagination
        this.renderPagination($pagination, data.total, data.offset, this.playlistsLimit, 'playlists');
    },

    // Load liked songs
    async loadLikedSongs(offset = 0) {
        if (!SpotifyAPI.userId) return;

        const $container = $('#liked-songs-list');
        const $pagination = $('#liked-songs-pagination');

        $container.html(`
            <div class="col-12 text-center text-muted">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading your liked songs...</p>
            </div>
        `);

        try {
            const response = await SpotifyAPI.getLikedSongs(this.likedSongsLimit, offset);

            this.currentLikedSongsPage = Math.floor(offset / this.likedSongsLimit);
            this.displayLikedSongs(response, $container, $pagination);
            this.isLoaded.likedSongs = true;

        } catch (error) {
            console.error('Error loading liked songs:', error);
            $container.html(`
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load liked songs. Please try again.
                    </div>
                </div>
            `);
        }
    },

    displayLikedSongs(data, $container, $pagination) {
        $container.empty();
        $pagination.empty();

        if (!data.items || data.items.length === 0) {
            $container.html(`
                <div class="col-12 text-center text-muted">
                    <i class="fas fa-heart display-4 mb-3"></i>
                    <p>No liked songs yet. Start liking songs in Spotify!</p>
                </div>
            `);
            return;
        }

        data.items.forEach(track => {
            const imageUrl = track.album?.images && track.album.images.length > 0
                ? track.album.images[0].url
                : 'https://via.placeholder.com/64?text=No+Image';

            const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
            const durationMs = track.durationMs || track.duration_ms || 0;
            const duration = this.formatDuration(durationMs);

            const templateData = {
                id: track.id,
                name: track.name,
                artists: artists,
                albumName: track.album?.name || 'Unknown Album',
                imageUrl: imageUrl,
                uri: track.uri,
                duration: duration,
                durationMs: durationMs
            };

            $container.append(this.templates.likedSong(templateData));
        });

        // Add pagination
        this.renderPagination($pagination, data.total, data.offset, this.likedSongsLimit, 'likedSongs');
    },

    // Load recently played
    async loadRecentlyPlayed() {
        if (!SpotifyAPI.userId) return;

        const $container = $('#recently-played-list');

        $container.html(`
            <div class="col-12 text-center text-muted">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading recently played...</p>
            </div>
        `);

        try {
            const response = await SpotifyAPI.getRecentlyPlayed(this.recentlyPlayedLimit);

            this.displayRecentlyPlayed(response, $container);
            this.isLoaded.recentlyPlayed = true;

        } catch (error) {
            console.error('Error loading recently played:', error);
            $container.html(`
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load recently played. Please try again.
                    </div>
                </div>
            `);
        }
    },

    displayRecentlyPlayed(data, $container) {
        $container.empty();

        if (!data.items || data.items.length === 0) {
            $container.html(`
                <div class="col-12 text-center text-muted">
                    <i class="fas fa-history display-4 mb-3"></i>
                    <p>No recently played tracks. Start listening to music!</p>
                </div>
            `);
            return;
        }

        data.items.forEach(item => {
            const track = item.track;
            if (!track) return;

            const imageUrl = track.album?.images && track.album.images.length > 0
                ? track.album.images[0].url
                : 'https://via.placeholder.com/64?text=No+Image';

            const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
            const durationMs = track.durationMs || track.duration_ms || 0;
            const playedAt = this.formatPlayedAt(item.playedAt || item.played_at);

            const templateData = {
                id: track.id,
                name: track.name,
                artists: artists,
                albumName: track.album?.name || 'Unknown Album',
                imageUrl: imageUrl,
                uri: track.uri,
                playedAt: playedAt,
                durationMs: durationMs
            };

            $container.append(this.templates.recentlyPlayed(templateData));
        });
    },

    // Render pagination controls
    renderPagination($container, total, currentOffset, limit, type) {
        const totalPages = Math.ceil(total / limit);
        const currentPage = Math.floor(currentOffset / limit);

        if (totalPages <= 1) return;

        let html = '<nav><ul class="pagination">';

        // Previous button
        html += `<li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" data-type="${type}">Previous</a>
        </li>`;

        // Page numbers (show max 5 pages)
        const startPage = Math.max(0, currentPage - 2);
        const endPage = Math.min(totalPages - 1, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}" data-type="${type}">${i + 1}</a>
            </li>`;
        }

        // Next button
        html += `<li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" data-type="${type}">Next</a>
        </li>`;

        html += '</ul></nav>';
        html += `<p class="text-muted text-center small">Showing ${currentOffset + 1}-${Math.min(currentOffset + limit, total)} of ${total}</p>`;

        $container.html(html);

        // Bind pagination clicks
        $container.find('.page-link').on('click', (e) => {
            e.preventDefault();
            const $link = $(e.currentTarget);
            if ($link.parent().hasClass('disabled') || $link.parent().hasClass('active')) return;

            const page = parseInt($link.data('page'));
            const pageType = $link.data('type');
            const offset = page * limit;

            if (pageType === 'playlists') {
                this.loadMyPlaylists(offset);
            } else if (pageType === 'likedSongs') {
                this.loadLikedSongs(offset);
            }
        });
    },

    // Handle play playlist
    async handlePlayPlaylist(e) {
        const $btn = $(e.currentTarget);
        const uri = $btn.data('uri');
        const name = $btn.data('name');

        if (!uri) return;

        // Show loading state
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');

        try {
            const deviceId = PlayerModule.deviceId || null;
            await SpotifyAPI.playPlaylist(uri, deviceId);
            console.log('Playing playlist:', name);
            // Switch to player tab
            App.switchTab('player');
        } catch (error) {
            console.error('Error playing playlist:', error);
            alert('Failed to play playlist. Make sure you have an active Spotify device.');
        } finally {
            $btn.prop('disabled', false).html('<i class="fas fa-play me-1"></i>Play');
        }
    },

    // Handle play track
    async handlePlayTrack(e) {
        const $btn = $(e.currentTarget);
        const uri = $btn.data('uri');
        const name = $btn.data('name');

        if (!uri) return;

        // Show loading state
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');

        try {
            const deviceId = PlayerModule.deviceId || null;
            await SpotifyAPI.playTrack(uri, deviceId);
            console.log('Playing track:', name);
            // Switch to player tab
            App.switchTab('player');
        } catch (error) {
            console.error('Error playing track:', error);
            alert('Failed to play track. Make sure you have an active Spotify device.');
        } finally {
            $btn.prop('disabled', false).html('<i class="fas fa-play me-1"></i>Play');
        }
    },

    // Format duration from milliseconds to mm:ss
    formatDuration(ms) {
        if (!ms) return '0:00';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    // Format played_at timestamp to relative time
    formatPlayedAt(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    },

    // Reset loaded state (called on logout)
    reset() {
        this.isLoaded = {
            playlists: false,
            likedSongs: false,
            recentlyPlayed: false
        };
        this.currentPlaylistsPage = 0;
        this.currentLikedSongsPage = 0;
    }
};

// Initialize when document is ready
$(document).ready(() => {
    Library.init();
});
