'use strict';

const db = require('../db');
const bcrypt = require('bcrypt');
const { sqlForPartialUpdate } = require('../helpers/sql');
const cloudinary = require('cloudinary').v2;
const {
	NotFoundError,
	BadRequestError,
	UnauthorizedError,
} = require('../expressError');

/////////////////////////
// Uploads an image file to Cloudinary
/////////////////////////
const uploadImage = async (imagePath) => {
	// Use the uploaded file's name as the asset's public ID and
	// allow overwriting the asset with new versions
	const options = {
		use_filename: true,
		unique_filename: false,
		overwrite: true,
	};

	try {
		// Upload the image
		const result = await cloudinary.uploader.upload(imagePath, options);
		console.log(result);
		return result.secure_url;
	} catch (error) {
		console.error(error);
	}
};

/** Related functions for heroes. */

class Hero {
	// follow/unfollow a hero
	static async followHero(userId, username, heroId, superheroName) {
		console.log('user_id: ' + userId);
		console.log('superhero_id: ' + heroId);
		const followRes = await db.query(
			`
			INSERT INTO
				follows
			(
				user_id,
				superhero_id,
				active
			)
			VALUES
				($1, $2, TRUE)
			RETURNING follow_id
			`,
			[userId, heroId]
		);
		console.log('SQL result in backend > models > user.js: ', followRes);
		const follow_id = followRes.rows[0];

		if (!follow_id) throw new NotFoundError(`No follow: ${heroId}`);

		// adding to activity log
		const followActivityRes = await db.query(
			`
          INSERT INTO
               recent_activity
          (
               user_id,
			username,
			superhero_id,
			superhero_name,
               description
          )
          VALUES
               ($1, $2, $3, $4, $5)
          RETURNING activity_id
          `,
			[userId, username, heroId, superheroName, 'followed']
		);
		const activity_id = followActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No follow activity: ${heroId}`);

		return follow_id;
	}

	static async unfollowHero(userId, username, heroId, superheroName) {
		const unfollowRes = await db.query(
			`
			DELETE FROM
				follows
			WHERE
				user_id=$1
					AND
				superhero_id=$2
			RETURNING follow_id
		    `,
			[userId, heroId]
		);
		console.log(
			'SQL result in backend > models > user.js: ',
			unfollowRes
		);
		const follow_id = unfollowRes.rows[0];

		if (!follow_id) throw new NotFoundError(`No unfollow: ${heroId}`);

		// adding to activity log
		const unfollowActivityRes = await db.query(
			`
          INSERT INTO
               recent_activity
			(
				user_id,
				username,
				superhero_id,
				superhero_name,
				description
			)
			VALUES
				($1, $2, $3, $4, $5)
			RETURNING activity_id
			`,
			[userId, username, heroId, superheroName, 'unfollowed']
		);
		const activity_id = unfollowActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No unfollow activity: ${heroId}`);

		return follow_id;
	}

	// LIKE/UNLIKE a comment
	static async likeComment(
		userId,
		username,
		heroId,
		superheroName,
		commentId
	) {
		const likeRes = await db.query(
			`
			INSERT INTO
				comment_likes
			(
				user_id,
				comment_id
			)
			VALUES
				($1, $2)
			RETURNING
				comment_like_id
          `,
			[userId, commentId]
		);
		const like_id = likeRes.rows[0];

		if (!like_id)
			throw new NotFoundError(`No comment_like: ${commentId}`);

		// adding to activity log
		const likeActivityRes = await db.query(
			`
			INSERT INTO
				recent_activity
			(
				user_id,
				username,
				superhero_id,
				superhero_name,
				description
			)
			VALUES
				($1, $2, $3, $4, $5)
			RETURNING activity_id
			`,
			[userId, username, heroId, superheroName, 'liked a comment on']
		);
		const activity_id = likeActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No comment_like: ${commentId}`);

		return like_id;
	}
	static async unlikeComment(
		userId,
		username,
		heroId,
		superheroName,
		commentId
	) {
		const likeRes = await db.query(
			`
          DELETE FROM
               comment_likes
          WHERE
               user_id=$1
                    AND
               comment_id=$2
          RETURNING
			comment_like_id
         `,
			[userId, commentId]
		);
		const like_id = likeRes.rows[0];

		if (!like_id)
			throw new NotFoundError(`No comment_like: ${commentId}`);

		// adding to activity log
		const unlikeActivityRes = await db.query(
			`
          INSERT INTO
               recent_activity
			(
				user_id,
				username,
				superhero_id,
				superhero_name,
				description
			)
			VALUES
				($1, $2, $3, $4, $5)
			RETURNING activity_id
			`,
			[userId, username, heroId, superheroName, 'unliked a comment on']
		);
		const activity_id = unlikeActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No comment_like: ${commentId}`);

		return like_id;
	}

	// LIKE/UNLIKE an image
	static async likeImage(userId, username, heroId, superheroName, imageUrl) {
		const likeRes = await db.query(
			`
			INSERT INTO
				image_likes
			(
				user_id,
				image_url
			)
			VALUES
				($1, $2)
			RETURNING
				image_like_id
          `,
			[userId, imageUrl]
		);
		const like_id = likeRes.rows[0];

		if (!like_id) throw new NotFoundError(`No image_like: ${imageUrl}`);

		// adding to activity log
		const likeActivityRes = await db.query(
			`
			INSERT INTO
				recent_activity
			(
				user_id,
				username,
				superhero_id,
				superhero_name,
				description
			)
			VALUES
				($1, $2, $3, $4, $5)
			RETURNING activity_id
			`,
			[userId, username, heroId, superheroName, 'liked an image for']
		);
		const activity_id = likeActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No image_like: ${imageUrl}`);

		return like_id;
	}
	static async unlikeImage(
		userId,
		username,
		heroId,
		superheroName,
		imageUrl
	) {
		const likeRes = await db.query(
			`
          DELETE FROM
               image_likes
          WHERE
               user_id=$1
                    AND
               image_url=$2
          RETURNING
			image_like_id
         `,
			[userId, imageUrl]
		);
		const like_id = likeRes.rows[0];

		if (!like_id) throw new NotFoundError(`No image_like: ${imageUrl}`);

		// adding to activity log
		const unlikeActivityRes = await db.query(
			`
          INSERT INTO
               recent_activity
			(
				user_id,
				username,
				superhero_id,
				superhero_name,
				description
			)
			VALUES
				($1, $2, $3, $4, $5)
			RETURNING activity_id
			`,
			[userId, username, heroId, superheroName, 'unliked an image for']
		);
		const activity_id = unlikeActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No image_like: ${imageUrl}`);

		return like_id;
	}

	// like/unlike a hero
	static async likeHero(userId, username, heroId, superheroName) {
		const likeRes = await db.query(
			`
			INSERT INTO
				likes
			(
				user_id,
				superhero_id,
				active
			)
			VALUES
				($1, $2, TRUE)
			RETURNING like_id
			`,
			[userId, heroId]
		);
		const like_id = likeRes.rows[0];

		if (!like_id) throw new NotFoundError(`No like: ${heroId}`);

		// adding to activity log
		const likeActivityRes = await db.query(
			`
			INSERT INTO
				recent_activity
				(
					user_id,
					username,
					superhero_id,
					superhero_name,
					description
				)
				VALUES
					($1, $2, $3, $4, $5)
				RETURNING activity_id
				`,
			[userId, username, heroId, superheroName, 'liked']
		);
		const activity_id = likeActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No like activity: ${heroId}`);

		return like_id;
	}
	static async unlikeHero(userId, username, heroId, superheroName) {
		const likeRes = await db.query(
			`
			DELETE FROM
				likes
			WHERE
				user_id=$1
					AND
				superhero_id=$2
			RETURNING like_id
		    `,
			[userId, heroId]
		);
		console.log('SQL result in backend > models > user.js: ', likeRes);
		const like_id = likeRes.rows[0];

		if (!like_id) throw new NotFoundError(`No unlike: ${heroId}`);

		const activityDescription = 'u|' + userId + ' unliked h|' + heroId;

		// adding to activity log
		const unlikeActivityRes = await db.query(
			`
			INSERT INTO
				recent_activity
				(
					user_id,
					username,
					superhero_id,
					superhero_name,
					description
				)
				VALUES
					($1, $2, $3, $4, $5)
				RETURNING activity_id
				`,
			[userId, username, heroId, superheroName, 'unliked']
		);
		const activity_id = unlikeActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No unlike activity: ${heroId}`);

		return like_id;
	}

	// comment on a hero
	static async commentOnHero(
		userId,
		username,
		heroId,
		superheroName,
		comments
	) {
		const commentRes = await db.query(
			`
				INSERT INTO
					comments
				(
					user_id,
					superhero_id,
					comments,
					active
				)
				VALUES
					($1, $2, $3, TRUE)
				RETURNING comment_id
				`,
			[userId, heroId, comments]
		);
		console.log('SQL result in backend > models > user.js: ', commentRes);
		const comment_id = commentRes.rows[0];

		if (!comment_id) throw new NotFoundError(`No comment: ${heroId}`);

		// adding to activity log
		const commentActivityRes = await db.query(
			`
          INSERT INTO
               recent_activity
			(
				user_id,
				username,
				superhero_id,
				superhero_name,
				description
			)
			VALUES
				($1, $2, $3, $4, $5)
			RETURNING activity_id
			`,
			[userId, username, heroId, superheroName, 'commented on']
		);
		const activity_id = commentActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No comment activity: ${heroId}`);

		return comment_id;
	}

	// upload image for a hero
	static async uploadHeroImage(
		userId,
		username,
		heroId,
		superheroName,
		cloudinaryURL
	) {
		console.log(
			'cloudinaryURL on backend > models > hero.js: ' + cloudinaryURL
		);

		const uploadHeroImageRes = await db.query(
			`
				INSERT INTO
					images
				(
					user_id,
					superhero_id,
					image_url,
					active
				)
				VALUES
					($1, $2, $3, TRUE)
				RETURNING image_url
				`,
			[userId, heroId, cloudinaryURL]
		);
		console.log(
			'SQL result in backend > models > user.js: ',
			uploadHeroImageRes
		);
		const image_url = uploadHeroImageRes.rows[0];

		if (!image_url) throw new NotFoundError(`No image: ${image_url}`);

		// adding to activity log
		const uploadActivityRes = await db.query(
			`
          INSERT INTO
               recent_activity
			(
				user_id,
				username,
				superhero_id,
				superhero_name,
				description
			)
			VALUES
				($1, $2, $3, $4, $5)
			RETURNING activity_id
			`,
			[
				userId,
				username,
				heroId,
				superheroName,
				'uploaded an image for',
			]
		);
		const activity_id = uploadActivityRes.rows[0];

		if (!activity_id)
			throw new NotFoundError(`No upload activity: ${heroId}`);

		return image_url;
	}

	// pull comments for a hero
	static async heroComments(heroId) {
		const heroCommentRes = await db.query(
			`
				SELECT
					c.*,
					u.username,
					to_char(c.created_dt, 'FMMM/FMDD/YYYY') AS created_date,
					to_char(c.created_dt, 'FMHH12:MI AM') AS created_time
				FROM
					comments c
				JOIN
					users u ON c.user_id=u.user_id
				WHERE
					superhero_id=$1
						AND
					c.active=TRUE
						AND
					u.active=TRUE
				ORDER BY
					created_dt DESC
				`,
			[heroId]
		);
		console.log(
			'SQL result in backend > models > user.js: ',
			heroCommentRes
		);
		const comments = heroCommentRes.rows;
		return comments;
	}

	// pull images for a hero
	static async heroImages(heroId) {
		const heroImagesRes = await db.query(
			`
				SELECT
					i.*,
					u.username,
					to_char(i.created_dt, 'FMMM/FMDD/YYYY') AS created_date,
					to_char(i.created_dt, 'FMHH12:MI AM') AS created_time
				FROM
					images i
				JOIN
					users u ON i.user_id=u.user_id
				WHERE
					superhero_id=$1
						AND
					i.active=TRUE
						AND
					u.active=TRUE
				ORDER BY
					created_dt DESC
				`,
			[heroId]
		);
		console.log(
			'SQL result in backend > models > user.js: ',
			heroImagesRes
		);
		const images = heroImagesRes.rows;
		return images;
	}
}

module.exports = Hero;
