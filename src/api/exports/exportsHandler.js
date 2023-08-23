const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(ProducerService, playlistService, validator) {
    this._ProducerService = ProducerService;
    this._playlistsService = playlistService;
    this._validator = validator;

    autoBind(this);
  }

  async postExportNotesHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);
    const { id: playlistId } = request.params;

    await this._playlistsService.verifyPlaylistOwner(playlistId, request.auth.credentials.id);

    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this._ProducerService.sendMessage('export:playlist', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda dalam antrean',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
