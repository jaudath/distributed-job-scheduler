const { Project, Queue } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const ApiError = require('../utils/ApiError');

const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.findAll({
    where: { owner_id: req.user.id },
    order: [['created_at', 'DESC']]
  });
  return success(res, projects);
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const project = await Project.create({ name, description, owner_id: req.user.id });
  return success(res, project, 'Project created', 201);
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    where: { id: req.params.id, owner_id: req.user.id },
    include: [{ model: Queue }]
  });
  if (!project) throw new ApiError(404, 'Project not found');
  return success(res, project);
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ where: { id: req.params.id, owner_id: req.user.id } });
  if (!project) throw new ApiError(404, 'Project not found');

  const { name, description } = req.body;
  await project.update({ name: name ?? project.name, description: description ?? project.description });
  return success(res, project, 'Project updated');
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ where: { id: req.params.id, owner_id: req.user.id } });
  if (!project) throw new ApiError(404, 'Project not found');

  await project.destroy();
  return success(res, null, 'Project deleted');
});

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject };
