const HTTP_STATUS_CODE = {
    OK: 200,
    CREATED: 201,
    DELETED: 202,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    BAD_GATEWAY: 502,
    INTERNAL_SERVER: 500,
}

const DEFAULT_PROFILE_IMG = {
    image: "userDefaultProfile.png"
}

const PATH_END_POINT = {
    userProfileImage: "http://103.177.225.86:4000/public/profile/",
    categoryImage: "http://103.177.225.86:4000/public/category/",
    cakeImage: "http://103.177.225.86:4000/public/cake/",
    customCakeImg: "http://103.177.225.86:4000/public/customCake/",
    sliderImg: "http://103.177.225.86:4000/public/sliderImg/",
}

const ORDER_ID = "#-"

const notificationMSGs = {
    newCategoryAdded(categoryName) {
        return {
            title: 'New Category added',
            message: `Yay! New category added: ${categoryName}.`,
            content: 'Category added'
        }
    },
    orderPlace(cakeName) {
        return {
            title: 'Order Placed',
            message: `Your order is booked for ${cakeName}`,
            content: 'ORDER_BOOKED'
        }
    },
    orderStatusUpdate(cakeName, status) {
        return {
            title: 'Status Updates',
            message: `The status of your ${cakeName} cake has been updated! ${status}`,
            content: 'STATUS_UPDATE'
        }
    }
}

module.exports = { HTTP_STATUS_CODE, DEFAULT_PROFILE_IMG, PATH_END_POINT, ORDER_ID, notificationMSGs }