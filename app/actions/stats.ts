"use server"

import prismadb from "@/lib/prismadb"
import { NextResponse } from 'next/server';

interface graphData {
  name: string
  total: number
}
export async function getTotalRevenue(storeId: string) {
  const paidOrders = await prismadb.order.findMany({
    where: {
      storeId,
      isPaid: true
    },
    include: {
      orderItems: {
        include: {
          product: true
        }
      }
    }
  })
  const TotalRevenue = paidOrders.reduce((t, o) => (t + o.orderItems.reduce((total, item) => total + item.product.price, 0)), 0)
  return TotalRevenue;

}
export async function getSalesCount(storeId: string) {
  const salesCount = await prismadb.order.count({
    where: {
      storeId,
      isPaid: true
    },

  })

  return salesCount;

}

export async function getStockCount(storeId: string) {
  const stockCount = await prismadb.product.count({
    where: {
      storeId,
      isArchived: false
    },

  })
  return stockCount;

}

export async function getGraphRevenue(storeId: string) {
  const paidOrders = await prismadb.order.findMany({
    where: {
      storeId,
      isPaid: true
    },
    include: {
      orderItems: {
        include: {
          product: true
        }
      }
    }
  })
  const monthlyRevenue: { [key: number]: number } = {};
  for (const order of paidOrders) {
    const month = order.createdAt.getMonth()
    const revenue = order.orderItems.reduce((t, i) => t + i.product.price, 0)
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenue
  }
  const graphData: graphData[] = [
    { name: "Jan", total: 0 },
    { name: "Feb", total: 0 },
    { name: "Mar", total: 0 },
    { name: "Apr", total: 0 },
    { name: "May", total: 0 },
    { name: "Jun", total: 0 },
    { name: "Jul", total: 0 },
    { name: "Aug", total: 0 },
    { name: "Sep", total: 0 },
    { name: "Oct", total: 0 },
    { name: "Nov", total: 0 },
    { name: "Dec", total: 0 },
  ]

  for (const month in monthlyRevenue) {
    graphData[parseInt(month)].total = monthlyRevenue[parseInt(month)]
  }
  return graphData


}


export async function getTopProduct(storeId: string) {
  try {
    const topProducts = await prismadb.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
      where: {
        product: {
          storeId: storeId,
        },
      },
    });

    const products = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prismadb.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });

        return {
          name: product?.name || 'Unknown',
          quantity: item._sum.quantity || 0,
        };
      })
    );

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch top products', errObj: error }, { status: 500 });
  }
}

export async function getTotalProductOrdered(storeId: string) {
  try {
    const total = await prismadb.orderItem.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        product: {
          storeId: storeId,
        },
      },

    });

    return NextResponse.json({
      totalOrderedProducts: total._sum.quantity ?? 0,
    });
  } catch (error) {
    console.error('[TOTAL_PRODUCTS_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function getTopCategories(storeId: string) {
  try {
    // Group orderItems by productId to get quantity per product
    const grouped = await prismadb.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      where: {
        // Assuming you want to filter by some storeId, add it here if needed
        product: {
          storeId: storeId,
        },
      },
    });

    // Map: categoryId -> totalQuantity
    const categoryTotals: Record<string, number> = {};

    for (const item of grouped) {
      const product = await prismadb.product.findUnique({
        where: { id: item.productId },
        select: { categoryId: true },
      });

      if (product?.categoryId) {
        categoryTotals[product.categoryId] =
          (categoryTotals[product.categoryId] || 0) + (item._sum.quantity || 0);
      }
    }

    // Fetch category names and sort by quantity
    const sorted = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const result = await Promise.all(
      sorted.map(async ([categoryId, quantity]) => {
        const category = await prismadb.category.findUnique({
          where: { id: categoryId },
          select: { name: true },
        });

        return {
          name: category?.name || 'Unknown',
          quantity,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[TOP_CATEGORIES_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function getProductRevenueData(storeId: string): Promise<{ name: string; revenue: number }[]> {
  // Step 1: Get all OrderItems with their Product's name and price
  const orderItems = await prismadb.orderItem.findMany({
    select: {
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
          price: true, // We use this from Product
        },

      },
    },
    where: {
      product: {
        storeId: storeId,
      },
    },
  });

  // Step 2: Aggregate revenue per product
  const productRevenueMap = new Map<string, { name: string; revenue: number }>();

  for (const item of orderItems) {
    const product = item.product;
    if (!product) continue;

    const revenue = product.price * item.quantity;

    if (productRevenueMap.has(product.id)) {
      productRevenueMap.get(product.id)!.revenue += revenue;
    } else {
      productRevenueMap.set(product.id, {
        name: product.name,
        revenue,
      });
    }
  }

  // Step 3: Convert to array
  const allProducts = Array.from(productRevenueMap.values());

  return allProducts
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export async function getCategoryRevenueData(storeId: string): Promise<{ name: string; revenue: number }[]> {
  // Step 1: Get all order items with product's price + category
  const orderItems = await prismadb.orderItem.findMany({
    select: {
      quantity: true,
      product: {
        select: {
          id: true,
          price: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

    },
    where: {
      product: {
        storeId: storeId,
      },
    },
  });

  // Step 2: Aggregate revenue per category
  const categoryMap = new Map<string, { name: string; revenue: number }>();

  for (const item of orderItems) {
    const category = item.product.category;
    const price = item.product.price;

    if (!category) continue;

    const revenue = price * item.quantity;

    if (categoryMap.has(category.id)) {
      categoryMap.get(category.id)!.revenue += revenue;
    } else {
      categoryMap.set(category.id, {
        name: category.name,
        revenue,
      });
    }
  }
  const allCategories = Array.from(categoryMap.values());

  return allCategories
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}
