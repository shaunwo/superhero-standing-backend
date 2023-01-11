'use strict';

/** Routes for users. */

const jsonschema = require('jsonschema');

const express = require('express');
const { ensureCorrectUserId, ensureLoggedIn } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const Hero = require('../models/hero');
const { createToken } = require('../helpers/tokens');

const router = express.Router();

router.get(
	'/:userId/follow/hero/:heroId/:username/:superheroName',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			const follow_id = await Hero.followHero(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName
			);
			return res.json({ follow_id });
		} catch (err) {
			return next(err);
		}
	}
);
router.get(
	'/:userId/unfollow/hero/:heroId/:username/:superheroName',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			const follow_id = await Hero.unfollowHero(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName
			);
			return res.json({ follow_id });
		} catch (err) {
			return next(err);
		}
	}
);

router.get(
	'/:userId/like/hero/:heroId/:username/:superheroName',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			const like_id = await Hero.likeHero(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName
			);
			return res.json({ like_id });
		} catch (err) {
			return next(err);
		}
	}
);
router.get(
	'/:userId/unlike/hero/:heroId/:username/:superheroName',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			console.log('Inside backend > routes > user.js: ');
			const like_id = await Hero.unlikeHero(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName
			);
			return res.json({ like_id });
		} catch (err) {
			return next(err);
		}
	}
);

// LIKE / UNLIKE A COMMENT
router.get(
	'/:userId/like/comment/:heroId/:username/:superheroName/:comment_id',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			const comment_like_id = await Hero.likeComment(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName,
				req.params.comment_id
			);
			return res.json({ comment_like_id });
		} catch (err) {
			return next(err);
		}
	}
);
router.get(
	'/:userId/unlike/comment/:heroId/:username/:superheroName/:comment_id',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			const comment_like_id = await Hero.unlikeComment(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName,
				req.params.comment_id
			);
			return res.json({ comment_like_id });
		} catch (err) {
			return next(err);
		}
	}
);

// LIKE / UNLIKE AN IMAGE
router.post(
	'/:userId/like/image/:heroId/:username/:superheroName',
	ensureCorrectUserId,
	async function(req, res, next) {
		const { image_url } = req.body;
		try {
			const image_like_id = await Hero.likeImage(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName,
				image_url
			);
			return res.json({ image_like_id });
		} catch (err) {
			return next(err);
		}
	}
);
router.post(
	'/:userId/unlike/image/:heroId/:username/:superheroName',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			const { image_url } = req.body;
			const image_like_id = await Hero.unlikeImage(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName,
				image_url
			);
			return res.json({ image_like_id });
		} catch (err) {
			return next(err);
		}
	}
);

router.post(
	'/:userId/comment/hero/:heroId/:username/:superheroName',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			const { comments } = req.body;
			const comment_id = await Hero.commentOnHero(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName,
				comments
			);
			return res.json({ comment_id });
		} catch (err) {
			return next(err);
		}
	}
);
router.post(
	'/:userId/upload/hero/:heroId/:username/:superheroName/',
	ensureCorrectUserId,
	async function(req, res, next) {
		try {
			const { cloudinaryURL } = req.body;
			console.log(
				'req.body on backend > routes > heroes.js: ',
				req.body
			);
			console.log(
				'cloudinaryURL on backend > routes > heroes.js: ' +
					cloudinaryURL
			);
			const image_url = await Hero.uploadHeroImage(
				req.params.userId,
				req.params.username,
				req.params.heroId,
				req.params.superheroName,
				cloudinaryURL
			);
			return res.json({ image_url });
		} catch (err) {
			return next(err);
		}
	}
);

router.get('/comments/:heroId', ensureLoggedIn, async function(req, res, next) {
	console.log('Inside backend > routes > heroes.js: ... /comments/:heroId');
	try {
		const commentOnHero = await Hero.heroComments(req.params.heroId);
		return res.json(commentOnHero);
	} catch (err) {
		return next(err);
	}
});
router.get('/images/:heroId', ensureLoggedIn, async function(req, res, next) {
	console.log('Inside backend > routes > heroes.js: ... /images/:heroId');
	try {
		const imagesForHero = await Hero.heroImages(req.params.heroId);
		return res.json(imagesForHero);
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
