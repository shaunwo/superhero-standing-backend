'use strict';

/** Routes for external API calls */

//const jsonschema = require('jsonschema');

const express = require('express');

const router = express.Router();
const axios = require('axios');

router.get('/search/:searchFor', async function(req, res, next) {
	const searchFor = req.params.searchFor;

	axios.get(
		`https://www.superheroapi.com/api/10160133913239144/search/${searchFor}`
	)
		.then((response) => {
			console.log('Results: ', response.data.results);
			const searchResults = {
				data: response.data.results,
				statusCode: 200,
			};
			return res.json(searchResults);
		})
		.catch((error) => {
			return error;
		});
});
router.get('/hero/:id', async function(req, res, next) {
	const id = req.params.id;

	console.log(
		'URL: ' + `https://www.superheroapi.com/api/10160133913239144/${id}`
	);
	axios.get(`https://www.superheroapi.com/api/10160133913239144/${id}`)
		.then((response) => {
			console.log('Results: ', response.data);
			const searchResults = {
				data: response.data,
				statusCode: 200,
			};
			return res.json(searchResults);
		})
		.catch((error) => {
			return error;
		});
});

module.exports = router;
