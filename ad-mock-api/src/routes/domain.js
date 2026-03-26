const { Router } = require('express');
const store = require('../data/store');
const router = Router();
router.get('/', (req, res) => { res.json(store.domainInfo); });
module.exports = router;
