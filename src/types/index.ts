export type Cart = {
    foodItems: MenuItem[]
    totalPrice?: number
}

export type Customer = {
    id: string;
    membership: "ByteElite" | "Standard";
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    password: string;
    profileURI?: string;
    cart: Cart;
}

export type CreateCustomerInput = {
    firstName: string;
    lastName: string;
    membership: "ByteElite" | "Standard";
    email: string;
    phone: string;
    password: string;
    address?: string;
    profileURI?: string;
    isElite?: boolean;
    cart?: Cart;
}

export type UpdateCustomerInput = {
    id?: string;
    firstName?: string;
    membership?: "ByteElite" | "Standard";
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    address?: string;
    profileURI?: string;
    cart?: Cart;
}

enum MenuItemType {
    MAIN = "main",
    SIDE = "side",
    DRINK = "drink",
    STARTER = "starter",
    DESSERT = "dessert",
    POPULAR = "popular",
}

export type MenuItem = {
    category: string;
    name: string;
    price: number;
    description: string;
    imagePath: string;
    isAvailable: boolean;
}


export type Order = {
    id: string
    customerId: string
    customer: Customer
    restaurant: Restaurant
    foodItems: MenuItem[]
    orderStatus: "pending" | "accepted" | "declined" | "completed" | "cancelled" | "new" | "default" | "delivering" | "pendingDriver" //default is for an errored state, should be deprecated
    totalPrice: number
    orderDate: number
    payment?: Payment
    deliveryInstruction: string
    deliveryAddress: string
}

export type CreateOrderInput = {
    customerId: string
    customer: Customer

    restaurant: Restaurant
    foodItems: MenuItem[]
    orderStatus: "pending" | "accepted" | "declined" | "completed" | "cancelled" | "new" | "default" | "delivering" | "pendingDriver" //default is for an errored state, should be deprecated
    totalPrice: number
    deliveryInstruction: string
    deliveryAddress: string
    payment?: Payment
}

export type UpdateOrderInput = {
    customer?: Customer
    id?: string
    customerId?: string
    restaurant?: Restaurant
    foodItems?: MenuItem[]
    orderStatus?: "pending" | "accepted" | "declined" | "completed" | "cancelled" | "new" | "default" | "delivering" | "pendingDriver" //default is for an errored state, should be deprecated
    totalPrice?: number
    deliveryInstruction?: string
    deliveryAddress?: string
    payment?: Payment
}


export type Payment = {
    id: string
    amount:number
    type:"card"|"paypal"
    last4Digits:string
    createdAt:Date
}


enum FoodCategory {
    KOREAN = "korean",
    JAPANESE = "japanese",
    VIETNAMESE = "vietnamese",
    CHINESE = "chinese",
    THAI = "thai",
    INDIAN = "indian",
    MIDDLE_EASTERN = "middle eastern",
    MEDITERRANEAN = "mediterranean",
    ITALIAN = "italian",
    VEGAN = "vegan",
    EASTERN = "eastern",
    WESTERN = "western",
    ASIAN = "asian",
    CHICKEN = "chicken",
    BURGER = "burger",
    PIZZA = "pizza",
}

export type Restaurant = {
    id: string;
    categories?: FoodCategory[];
    name: string;
    address: string;
    email: string;
    password: string;
    phone: string;
    averageRating?: number;
    averageWaitTime?: number;
    description: string;
    menu: MenuItem[];
}

export type CreateRestaurantInput = {
    name: string;
    email: string;
    password: string;
    address: string;
    phone: string;
    description: string;
    menu: MenuItem[];
    categories?: FoodCategory[];
    averageRating?: number;
    averageWaitTime?: number;
}

export type UpdateRestaurantInput = {
    id?: string;
    email?: string;
    password?: string;
    name?: string;
    address?: string;
    phone?: string;
    description?: string;
    menu?: MenuItem[];
    categories?: FoodCategory[];
    averageRating?: number;
    averageWaitTime?: number;
}

export type Review = {
    id: string;
    customerId: string;
    restaurantId: string;
    rating: number;
    comment: string;
    createdAt: number;
}

export type CreateReviewInput = {
    customerId: string;
    restaurantId: string;
    rating: number;
    comment: string;
}

export type UpdateReviewInput = {
    id?: string;
    customerId?: string;
    restaurantId?: string;
    rating?: number;
    comment?: string;
}