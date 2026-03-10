const fs = require("fs")
const csv = require("csv-parser")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function run() {

  const products = []

  fs.createReadStream("./scripts/data/catalogo_productos.csv")
    .pipe(csv())
    .on("data", (row) => {

      products.push({
        sku: row.SKU.trim(),
        description: row.Descripcion,
        family: row.Familia,
        line: row.Linea,
        manufacturer: row.Fabricante,
        listPrice: parseFloat(row.Precio_Lista),
        currency: row.Moneda
      })

    })
    .on("end", async () => {

      for (const product of products) {

        await prisma.product.upsert({
          where: { sku: product.sku },
          update: product,
          create: product
        })

      }

      console.log("Catalogo importado correctamente")

      process.exit()

    })

}

run()