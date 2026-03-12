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
      },
      orderBy: {
        name: "asc"
      }
    });

    res.json({
      success: true,
      data: promoters
    });
  } catch (error) {
    console.error("Error fetching promoters:", error);

    res.status(500).json({
      success: false,
      message: "Error al obtener promotores"
    });
  }
};
