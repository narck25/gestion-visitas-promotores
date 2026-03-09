const prisma = require("../config/database");

// Controlador extremadamente simple solo para pruebas
exports.createVisit = async (req, res) => {
  console.log("createVisit llamado");
  res.status(201).json({
    success: true,
    message: "Visita creada (simulado)",
    data: { test: "ok" }
  });
};

exports.getVisits = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { visits: [] }
  });
};

exports.getVisitById = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { visit: {} }
  });
};

exports.updateVisit = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Visita actualizada"
  });
};

exports.deleteVisit = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Visita eliminada"
  });
};

exports.getVisitStats = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { stats: {} }
  });
};