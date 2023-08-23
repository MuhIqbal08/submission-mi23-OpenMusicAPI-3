const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const { mapDBToAlbumModel, mapDBToSongModel } = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows.map(mapDBToAlbumModel);
  }

  async getAlbumsById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      year: result.rows[0].year,
      coverUrl: result.rows[0].cover,
    };
  }

  async getSongsByAlbumId(albumId) {
    const query = {
      text: 'SELECT * FROM songs WHERE album_id = $1',
      values: [albumId],
    };
    const result = await this._pool.query(query);

    return result.rows.map(mapDBToSongModel);
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async saveAlbumCoverUrl(id, coverUrl) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async addLikeAlbum(albumId, userId) {
    const queryCheck = {
      text: 'SELECT EXISTS(SELECT 1 FROM user_album_likes WHERE user_id = $1 AND album_id = $2)',
      values: [userId, albumId],
    };

    const checkResult = await this._pool.query(queryCheck);
    const hasLiked = checkResult.rows[0].exists;

    if (hasLiked) {
      throw new InvariantError('Anda sudah menyukai album ini sebelumnya.');
    }

    const id = `like-${nanoid(16)}`;
    const queryInsert = {
      text: 'INSERT INTO user_album_likes VALUES ($1, $2, $3)',
      values: [id, userId, albumId],
    };

    await this._cacheService.delete(`albumLikes:${albumId}`);
    await this._pool.query(queryInsert);
  }

  async removeAlbumLike(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    await this._cacheService.delete(`albumLikes:${albumId}`);
    await this._pool.query(query);
  }

  async getAlbumLikesCount(albumId) {
    try {
      const result = await this._cacheService.get(`albumLikes:${albumId}`);
      return {
        likes: JSON.parse(result),
        source: 'cache',
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      await this._cacheService.set(`albumLikes:${albumId}`, JSON.stringify(result.rowCount));
      return {
        likes: result.rowCount,
        source: 'database',
      };
    }
  }

  async verifyAlbum(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return result.rows[0];
  }
}

module.exports = AlbumsService;
