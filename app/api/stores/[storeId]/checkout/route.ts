import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prismadb from "@/lib/prismadb";

const OrderInputSchema = z.object({
    lineItems: z.array(z.object({
        productId: z.string().min(1),
        quantity: z.number().min(1)
    })),
    customerName: z.string().min(1),
    phone: z.string().min(1),
    orderType: z.enum(["IN_STORE", "ONLINE"]),
    deliveryAddress: z.string().optional()
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ storeId: string }> }
) {
    const { storeId } = await params;
    const body = await req.json();
    const parsed = OrderInputSchema.safeParse(body);
    if (!parsed.success) {
        const errors = parsed.error.errors.map(e => e.message).join(", ");
        return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { lineItems, customerName, phone, orderType, deliveryAddress } = parsed.data;

    // Entire checkout in ONE atomic transaction
    try {
        const result = await prismadb.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { id: storeId }
            });
            if (!store) throw new Error("Store not found");

            const orderItems = [];
            let subTotal = 0;

            for (const item of lineItems) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, price: true, quantity: true }
                });

                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }
                if (product.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.productId}`);
                }

                await tx.product.update({
                    where: { id: product.id },
                    data: { quantity: { decrement: item.quantity } }
                });

                orderItems.push({
                    productId: product.id,
                    quantity: item.quantity
                });

                subTotal += product.price * item.quantity;
            }
            const discount = subTotal * 0.1; // 10% discount example
            const tax = (subTotal - discount) * 0.08;
            // Example discount logic
            const total = subTotal - discount + tax;

            const order = await tx.order.create({
                data: {
                    isPaid: orderType === "ONLINE" ? false : true,
                    storeId,
                    customerName,
                    phone,
                    deliveyAddress: deliveryAddress ?? "",
                    orderType,
                    subTotal,
                    tax,
                    discount,
                    total,
                    orderStatus: orderType === "ONLINE" ? "PENDING" : "COMPLETED",
                    orderItems: {
                        createMany: { data: orderItems }
                    }
                }
            });

            return order;
        });

        return NextResponse.json({ order: result }, { status: 201 });

    } catch (err: unknown) {
        console.error("Checkout failed:", err);
        return NextResponse.json({ error: err || "Something went wrong" }, { status: 500 });
    }
}
