const autoBind = require('auto-bind');
const config = require('../../utils/config');

class AlbumsHandler {
  constructor(albumService, storageService, validator) {
    this._albumService = albumService;
    this._storageService = storageService;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumsHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name = 'untitled-album', year } = request.payload;

    const albumId = await this._albumService.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Catatan berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler() {
    const albums = await this._albumService.getAlbums();

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumsByIdHandler(request) {
    const { id } = request.params;
    const album = await this._albumService.getAlbumsById(id);
    const songs = await this._albumService.getSongsByAlbumId(id);

    album.songs = songs;

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumsByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._albumService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumsByIdHandler(request) {
    const { id } = request.params;
    await this._albumService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadImageToAlbumHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;

    this._validator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const imagePath = `http://${config.app.host}:${config.app.port}/albums/images/${filename}`;

    await this._albumService.saveAlbumCoverUrl(id, imagePath);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postAlbumsLikesHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumService.verifyAlbum(id);
    await this._albumService.addLikeAlbum(id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menyukai album.',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumsLikesHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumService.removeAlbumLike(id, credentialId);

    return h.response({
      status: 'success',
      message: 'Berhasil menghapus tanda suka dari album.',
    });
  }

  async getAlbumsLikesHandler(request, h) {
    const { id } = request.params;

    await this._albumService.verifyAlbum(id);
    const likesCount = await this._albumService.getAlbumLikesCount(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: likesCount.likes,
      },
    });
    response.code(200);
    response.header('X-Data-Source', likesCount.source);
    return response;
  }
}

module.exports = AlbumsHandler;
