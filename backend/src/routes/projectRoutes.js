const express = require('express');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

const router = express.Router();
router.use(authenticate);

router.get('/', listProjects);
router.post('/', validate([body('name').trim().notEmpty().withMessage('name is required')]), createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
