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
}

const ORDER_ID = "#-"

module.exports = { HTTP_STATUS_CODE, DEFAULT_PROFILE_IMG, PATH_END_POINT, ORDER_ID }