'use strict';

const db = require('../db');
const bcrypt = require('bcrypt');
const { sqlForPartialUpdate } = require('../helpers/sql');
const {
	NotFoundError,
	BadRequestError,
	UnauthorizedError,
} = require('../expressError');

const { BCRYPT_WORK_FACTOR } = require('../config.js');

/** Related functions for users. */

class User {
	/** authenticate user with username, password.
	 *
	 * Returns { username, first_name, last_name, email, is_admin }
	 *
	 * Throws UnauthorizedError is user not found or wrong password.
	 **/

	static async authenticate(username, password) {
		// try to find the user first
		const result = await db.query(
			`
			SELECT 
				user_id,
				username,
				password,
				first_name AS "firstName",
				last_name AS "lastName",
				email
	          FROM
				users
           	WHERE
				username = $1
			`,
			[username]
		);

		const user = result.rows[0];

		if (user) {
			// compare hashed password to a new hash from password
			const isValid = await bcrypt.compare(password, user.password);
			if (isValid === true) {
				delete user.password;
				return user;
			}
		}

		throw new UnauthorizedError('Invalid username/password');
	}

	/** Register user with data.
	 *
	 * Returns { username, firstName, lastName, email, isAdmin }
	 *
	 * Throws BadRequestError on duplicates.
	 **/

	static async register({ username, password, firstName, lastName, email }) {
		const duplicateCheck = await db.query(
			`SELECT username
           FROM users
           WHERE username = $1`,
			[username]
		);

		if (duplicateCheck.rows[0]) {
			throw new BadRequestError(`Duplicate username: ${username}`);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			BCRYPT_WORK_FACTOR
		);

		const result = await db.query(
			`INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
		  active)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email`,
			[username, hashedPassword, firstName, lastName, email]
		);

		const user = result.rows[0];

		return user;
	}

	/** Find all users.
	 *
	 * Returns [{ username, first_name, last_name, email, is_admin }, ...]
	 **/

	static async findAll() {
		const result = await db.query(
			`SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email
           FROM users
           ORDER BY username`
		);

		return result.rows;
	}

	/** Given a username, return data about user.
	 *
	 * Returns { username, first_name, last_name, is_admin, jobs }
	 *   where jobs is { id, title, company_handle, company_name, state }
	 *
	 * Throws NotFoundError if user not found.
	 **/

	static async get(username) {
		const userRes = await db.query(
			`
			SELECT 
				user_id,
				username,
				first_name AS "firstName",
				last_name AS "lastName",
				email,
				location,
				bio
           	FROM
				users
           	WHERE
				username = $1
			`,
			[username]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		// looking for this user's hero followings
		const userHeroFollowsRes = await db.query(
			`
			SELECT
				f.superhero_id
			FROM
			 	follows AS f
			WHERE
			 	f.user_id = $1
					AND
				f.active = TRUE
			 `,
			[user.user_id]
		);

		user.heroFollowIds = userHeroFollowsRes.rows.map(
			(a) => a.superhero_id
		);

		// looking for this user's hero likes
		const userHeroLikesRes = await db.query(
			`
			SELECT
				l.superhero_id
			FROM
				likes AS l
			WHERE
				l.user_id = $1
					AND
				l.active = TRUE
			`,
			[user.user_id]
		);

		user.heroLikeIds = userHeroLikesRes.rows.map((b) => b.superhero_id);

		// looking for currentUser's hero comments likes
		const usersHeroCommentsLikesRes = await db.query(
			`
			SELECT
				c.comment_id,
				COUNT(*) AS superhero_comment_like_count
			FROM
				comment_likes AS c
			WHERE
				c.user_id = $1
			GROUP BY
				comment_id
			ORDER BY
				comment_id ASC
			`,
			[user.user_id]
		);
		user.heroCommentLikedIds = usersHeroCommentsLikesRes.rows.map(
			(b) => b.comment_id
		);

		// looking for currentUser's hero images likes
		const usersHeroImagesLikesRes = await db.query(
			`
			SELECT
				i.image_url,
				COUNT(*) AS superhero_image_like_count
			FROM
				image_likes AS i
			WHERE
				i.user_id = $1
			GROUP BY
				image_url
			ORDER BY
				image_url ASC
			`,
			[user.user_id]
		);
		user.heroImageLikedIds = usersHeroImagesLikesRes.rows.map(
			(b) => b.image_url
		);

		// looking for ALL users' hero followings
		const allUsersHeroFollowsRes = await db.query(
			`
			SELECT
				f.superhero_id,
				COUNT(*) AS superhero_follow_count
			FROM
			 	follows AS f
			WHERE
			 	f.active = TRUE
			GROUP BY
				superhero_id
			ORDER BY
				superhero_id ASC
			`
		);
		let heroAllUsersFollowIds = {};
		for (let c = 0; c < allUsersHeroFollowsRes.rows.length; c++) {
			heroAllUsersFollowIds[
				+allUsersHeroFollowsRes.rows[c].superhero_id
			] = +allUsersHeroFollowsRes.rows[c].superhero_follow_count;
		}
		user.heroAllUsersFollowIds = heroAllUsersFollowIds;

		// looking for ALL users' hero likes
		const allUsersHeroLikesRes = await db.query(
			`
			SELECT
				l.superhero_id,
				COUNT(*) AS superhero_like_count
			FROM
				likes AS l
			WHERE
				l.active = TRUE
			GROUP BY
				superhero_id
			ORDER BY
				superhero_id ASC
			`
		);
		let heroAllUsersLikeIds = {};
		for (let d = 0; d < allUsersHeroLikesRes.rows.length; d++) {
			heroAllUsersLikeIds[
				+allUsersHeroLikesRes.rows[d].superhero_id
			] = +allUsersHeroLikesRes.rows[d].superhero_like_count;
		}
		user.heroAllUsersLikeIds = heroAllUsersLikeIds;

		// looking for ALL users' hero comments
		const allUsersHeroCommentsRes = await db.query(
			`
			SELECT
				c.superhero_id,
				COUNT(*) AS superhero_comment_count
			FROM
				comments AS c
			WHERE
				c.active = TRUE
			GROUP BY
				superhero_id
			ORDER BY
				superhero_id ASC
			`
		);
		let heroAllUsersCommentsIds = {};
		for (let e = 0; e < allUsersHeroCommentsRes.rows.length; e++) {
			heroAllUsersCommentsIds[
				+allUsersHeroCommentsRes.rows[e].superhero_id
			] = +allUsersHeroCommentsRes.rows[e].superhero_comment_count;
		}
		user.heroAllUsersCommentsIds = heroAllUsersCommentsIds;

		// looking for ALL users' hero comments likes
		const allUsersHeroCommentsLikesRes = await db.query(
			`
			SELECT
				c.comment_id,
				COUNT(*) AS superhero_comment_like_count
			FROM
				comment_likes AS c
			GROUP BY
				comment_id
			ORDER BY
				comment_id ASC
			`
		);
		let heroAllUsersCommentLikedIds = {};
		for (let e = 0; e < allUsersHeroCommentsLikesRes.rows.length; e++) {
			heroAllUsersCommentLikedIds[
				+allUsersHeroCommentsLikesRes.rows[e].comment_id
			] = +allUsersHeroCommentsLikesRes.rows[e]
				.superhero_comment_like_count;
		}
		user.heroAllUsersCommentLikedIds = heroAllUsersCommentLikedIds;

		// looking for ALL users' hero images
		const allUsersHeroImagesRes = await db.query(
			`
			SELECT
				i.superhero_id,
				COUNT(*) AS superhero_image_count
			FROM
				images AS i
			WHERE
				i.active = TRUE
			GROUP BY
				superhero_id
			ORDER BY
				superhero_id ASC
			`
		);
		let heroAllUsersImagesIds = {};
		for (let e = 0; e < allUsersHeroImagesRes.rows.length; e++) {
			heroAllUsersImagesIds[
				+allUsersHeroImagesRes.rows[e].superhero_id
			] = +allUsersHeroImagesRes.rows[e].superhero_image_count;
		}
		user.heroAllUsersImagesIds = heroAllUsersImagesIds;

		// looking for ALL users' hero images likes
		const allUsersHeroImagesLikesRes = await db.query(
			`
			SELECT
				i.image_url,
				COUNT(*) AS superhero_image_like_count
			FROM
				image_likes AS i
			GROUP BY
				image_url
			ORDER BY
				image_url ASC
			`
		);
		let heroAllUsersImageLikedIds = {};
		for (let e = 0; e < allUsersHeroImagesLikesRes.rows.length; e++) {
			heroAllUsersImageLikedIds[
				allUsersHeroImagesLikesRes.rows[e].image_url
			] = +allUsersHeroImagesLikesRes.rows[e]
				.superhero_image_like_count;
		}
		user.heroAllUsersImageLikedIds = heroAllUsersImageLikedIds;

		// looking for this user's APPROVED mortal followings
		const userMortalFollowsRes = await db.query(
			`
			SELECT
				u.connectee_user_id
			FROM
			 	user_connections AS u
			WHERE
			 	u.connector_user_id = $1
					AND
				u.active=TRUE
			 `,
			[user.user_id]
		);

		user.mortalFollowIds = userMortalFollowsRes.rows.map(
			(f) => f.connectee_user_id
		);

		// looking for this user's PENDING mortal followings
		const userPendingMortalFollowsRes = await db.query(
			`
			SELECT
				u.connectee_user_id
			FROM
			 	user_connections AS u
			WHERE
			 	u.connector_user_id = $1
					AND
				u.active=FALSE
			 `,
			[user.user_id]
		);

		user.pendingMortalFollowIds = userPendingMortalFollowsRes.rows.map(
			(g) => g.connectee_user_id
		);

		// looking for this user's APPROVED mortal followings
		const userMortalFollowersRes = await db.query(
			`
					SELECT
						u.connector_user_id
					FROM
						 user_connections AS u
					WHERE
						 u.connectee_user_id = $1
							AND
						u.active=TRUE
					 `,
			[user.user_id]
		);

		user.mortalFollowerIds = userMortalFollowersRes.rows.map(
			(h) => h.connector_user_id
		);

		// looking for this user's PENDING mortal followings
		const userPendingMortalFollowersRes = await db.query(
			`
					SELECT
						u.connector_user_id
					FROM
						 user_connections AS u
					WHERE
						 u.connectee_user_id = $1
							AND
						u.active=FALSE
					 `,
			[user.user_id]
		);

		user.pendingMortalFollowerIds = userPendingMortalFollowersRes.rows.map(
			(i) => i.connector_user_id
		);

		return user;
	}

	static async getOther(id) {
		const userRes = await db.query(
			`
			SELECT 
				user_id,
				username,
				first_name AS "firstName",
				last_name AS "lastName",
				email,
				location,
				bio
           	FROM
				users
           	WHERE
				user_id = $1
			`,
			[id]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${id}`);

		// looking for this user's hero followings
		const userHeroFollowsRes = await db.query(
			`
			SELECT
				f.superhero_id
			FROM
			 	follows AS f
			WHERE
			 	f.user_id = $1
					AND
				f.active = TRUE
			 `,
			[user.user_id]
		);

		user.heroFollowIds = userHeroFollowsRes.rows.map(
			(a) => a.superhero_id
		);

		// looking for this user's hero likes
		const userHeroLikesRes = await db.query(
			`
			SELECT
				l.superhero_id
			FROM
				likes AS l
			WHERE
				l.user_id = $1
					AND
				l.active = TRUE
			`,
			[user.user_id]
		);

		user.heroLikeIds = userHeroLikesRes.rows.map((b) => b.superhero_id);

		return user;
	}

	static async getRecentActivity(id) {
		const recentActivityRes = await db.query(
			`
			SELECT 
				*,
				to_char(created_dt, 'FMMM/FMDD/YYYY') AS created_date,
				to_char(created_dt, 'FMHH12:MI AM') AS created_time
			FROM
				recent_activity
           	WHERE
				user_id = $1
			ORDER BY
				created_dt DESC
			`,
			[id]
		);

		const recentActivity = recentActivityRes.rows;

		if (!recentActivity)
			throw new NotFoundError(`No recent actvity: ${id}`);

		return recentActivity;
	}

	static async getLeaderBoard() {
		const leaderBoardRes = await db.query(
			`
			SELECT 
				superhero_id, COUNT(follow_id) AS FollowCount,
				(SELECT COUNT(like_id) FROM likes l WHERE active=TRUE AND l.superhero_id=f.superhero_id GROUP BY l.superhero_id) AS LikeCount,
				(SELECT COUNT(comment_id) FROM comments c WHERE active=TRUE AND c.superhero_id=f.superhero_id GROUP BY c.superhero_id) AS CommentCount
           	FROM
				follows f
           	WHERE
				active = TRUE
			GROUP BY
				superhero_id
			ORDER BY
				FollowCount DESC
			LIMIT
				15
			`
		);

		const leaderBoard = leaderBoardRes.rows;

		if (!leaderBoard) throw new NotFoundError(`No leaderBoard data`);

		return leaderBoard;
	}

	/** Update user data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain
	 * all the fields; this only changes provided ones.
	 *
	 * Data can include:
	 *   { firstName, lastName, password, email, isAdmin }
	 *
	 * Returns { username, firstName, lastName, email, isAdmin }
	 *
	 * Throws NotFoundError if not found.
	 *
	 * WARNING: this function can set a new password or make a user an admin.
	 * Callers of this function must be certain they have validated inputs to this
	 * or a serious security risks are opened.
	 */

	static async update(username, data) {
		if (data.password) {
			data.password = await bcrypt.hash(
				data.password,
				BCRYPT_WORK_FACTOR
			);
		}

		const { setCols, values } = sqlForPartialUpdate(data, {
			firstName: 'first_name',
			lastName: 'last_name',
		});
		const usernameVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE users 
                      SET ${setCols} 
				  , last_updated_dt=CURRENT_TIMESTAMP
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
						  location,
						  bio`;
		const result = await db.query(querySql, [...values, username]);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		delete user.password;
		return user;
	}

	/** Delete given user from database; returns undefined. */

	static async remove(username) {
		let result = await db.query(
			`DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
			[username]
		);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);
	}

	/* 
	FOLLOW / UNFOLLOW USER
	*/
	static async followUser(connector_user_id, connectee_user_id) {
		const userRes = await db.query(
			`
			INSERT INTO
				user_connections
					(connector_user_id,
					connectee_user_id,
					status,
					active)
			VALUES
				($1, $2, 0, FALSE)
			RETURNING
				connection_id
				`,
			[connector_user_id, connectee_user_id]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${connectee_user_id}`);
	}
	static async unfollowUser(connector_user_id, connectee_user_id) {
		const userRes = await db.query(
			`
			DELETE FROM
				user_connections
			WHERE
				connector_user_id=$1
					AND
				connectee_user_id=$2
			RETURNING
				connection_id
				`,
			[connector_user_id, connectee_user_id]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${connectee_user_id}`);
	}

	/* 
	APPROVE / REJECT FOLLOWER
	*/
	static async approveFollower(connector_user_id, connectee_user_id) {
		const userRes = await db.query(
			`
			UPDATE
				user_connections
			SET
				active=TRUE
			WHERE
				connectee_user_id=$1
					AND
				connector_user_id=$2
			RETURNING
				connection_id
				`,
			[connector_user_id, connectee_user_id]
		);
		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${connectee_user_id}`);
	}
	static async rejectFollower(connector_user_id, connectee_user_id) {
		const userRes = await db.query(
			`
			DELETE FROM
				user_connections
			WHERE
				connectee_user_id=$1
					AND
				connector_user_id=$2
			RETURNING
				connection_id
				`,
			[connector_user_id, connectee_user_id]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${connectee_user_id}`);
	}
}

module.exports = User;
