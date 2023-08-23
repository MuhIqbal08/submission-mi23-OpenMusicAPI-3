const AlbumsHandler = require('./albumsHandler');
const albumsRoutes = require('./albumsRoutes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, { albumService, storageService, validator }) => {
    const albumsHandler = new AlbumsHandler(albumService, storageService, validator);
    server.route(albumsRoutes(albumsHandler));
  },
};
