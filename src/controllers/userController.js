const prisma = require('../config/database');

exports.getPromoters = async (req, res) => {
  try {

    const promoters = await prisma.user.findMany({
      where: {
        role: "PROMOTER"
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    res.json({
      success: true,
      data: promoters
    });

  } catch (error) {

    console.error("Error obteniendo promotores:", error);

    res.status(500).json({
      success: false,
      message: "Error obteniendo promotores"
    });

  }
};