const ExportsHandler = require('./exportsHandler');
const routes = require('./exportsRoutes');

module.exports = {
  name: 'exports',
  version: '1.0.0',
  register: async (server, { ProducerService, playlistService, validator }) => {
    const exportsHandler = new ExportsHandler(ProducerService, playlistService, validator);
    server.route(routes(exportsHandler));
  },
};
