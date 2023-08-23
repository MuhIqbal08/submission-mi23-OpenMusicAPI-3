const routes = (handler) => [
  {
    method: 'POST',
    path: '/export/playlists/{id}',
    handler: handler.postExportNotesHandler,
    options: {
      auth: 'openmusicdb_jwt',
    },
  },
];

module.exports = routes;
