import { getGraphRevenue, getSalesCount, getStockCount, getTotalRevenue } from "@/app/actions/stats";
import { getTopCategories, getTopProduct, getTotalProductOrdered, getProductRevenueData, getCategoryRevenueData } from "@/app/actions/stats";
import { Overview } from "@/components/overview";
import { TopCategoriesPie, TopProductsPie, TopProductRevenuePie, TopCategoryRevenuePie } from "@/components/overview";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Heading from "@/components/ui/Heading";
import { Separator } from "@/components/ui/separator";
import { formatter } from "@/lib/utils";
import { CreditCard, IndianRupee, Package } from "lucide-react";

export default async function DashboardPage({ params }: { params: Promise<{ storeId: string }> }) {
    const { storeId } = await params
    const totalRevenue = await getTotalRevenue(storeId)
    const salesCount = await getSalesCount(storeId);
    const stockCount = await getStockCount(storeId)
    const graphData = await getGraphRevenue(storeId);
    type ProductData = {
        name: string;
        quantity: number;
    };
    type CategoryData = {
        name: string;
        quantity: number;
    };

    // type ProductRevenueData = {
    //     name: string;
    //     quantity: number;
    // };



    // type CategoryRevenueData = {
    //     name: string;
    //     quantity: number;
    // };


    const topProductstemp = await getTopProduct(storeId);
    const topProducts: ProductData[] = await topProductstemp.json();
    const topCategoriestemp = await getTopCategories(storeId);
    const topCategories: CategoryData[] = await topCategoriestemp.json();
    const totalProducedOrdertemp = await getTotalProductOrdered(storeId);
    const totalProducedOrdertemp2 = await totalProducedOrdertemp.json();
    const totalProducedOrder = totalProducedOrdertemp2.totalOrderedProducts;

    const topProductsRevenue = await getProductRevenueData(storeId);
    // const topProductsRevenue: ProductRevenueData[] = await topProductsRevenuetemp.json();
    // console.log(topProductsRevenue, "&&&&&&&");
    const topCategoriesRevenue = await getCategoryRevenueData(storeId);
    // const topCategoriesRevenue: CategoryRevenueData[] = await topCategoriesRevenuetemp.json();
    // console.log(topCategoriesRevenue, "-----");




    return (
        <div className="flex flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <Heading
                    title="Dashboard"
                    description="Overview of your store"
                />
                <Separator />
                <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-2  grid-cols-1">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Revenue
                            </CardTitle>

                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatter.format(totalRevenue)}

                            </div>
                        </CardContent>


                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Sales
                            </CardTitle>

                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                +{salesCount}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Products in Stock
                            </CardTitle>

                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stockCount}
                            </div>
                        </CardContent>


                    </Card>

                </div>
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview data={graphData} />
                    </CardContent>
                </Card>

                <Card className="col-span-6">
                    <CardHeader>
                        {/* <CardTitle>Distribution of Product the bases of Number of Order Placed</CardTitle> */}
                    </CardHeader>
                    <CardContent className="pl-2">
                        <TopProductsPie products={topProducts} totalQuantity={totalProducedOrder} />
                    </CardContent>
                </Card>
                <Card className="col-span-6">
                    <CardHeader>
                        {/* <CardTitle>Distribution of Categories the bases of Number of Order Placed</CardTitle> */}
                    </CardHeader>
                    <CardContent className="pl-2">
                        <TopCategoriesPie categories={topCategories} totalQuantity={totalProducedOrder} />
                    </CardContent>
                </Card>

                <Card className="col-span-6">
                    <CardHeader>
                        {/* <CardTitle>Distribution of Product the bases of Revenue of the Order Placed</CardTitle> */}
                    </CardHeader>
                    <CardContent className="pl-2">
                        <TopProductRevenuePie products={topProductsRevenue} totalRevenue={totalRevenue} />
                    </CardContent>
                </Card>
                <Card className="col-span-6">
                    <CardHeader>
                        {/* <CardTitle>Distribution of Categories the bases of Revenue of the Order Placed</CardTitle> */}
                    </CardHeader>
                    <CardContent className="pl-2">
                        <TopCategoryRevenuePie categories={topCategoriesRevenue} totalRevenue={totalRevenue} />
                    </CardContent>
                </Card>

            </div>


        </div>
    )
}