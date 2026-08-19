function doGet(e) {
    return Response.json(
        Response.success({
            message: "Expense Tracker API is running."
        })
    );
}

function doPost(e){
    return execute_(e);
}

function execute_(e) {
    try {
        const request = parseRequest_(e);
        const result = route_(request);

        return Response.json(result);
    }
    catch (error) {
        return Response.json(
            Response.error(
                "INTERNAL_ERROR",
                error.message
            )
        );
    }
}

function parseRequest_(e) {
    if (e == null) {
        throw new Error("Request is required.");
    }
    if (!e.postData) {
        throw new Error("Request body is required.");
    }

    return JSON.parse(e.postData.contents);
}

function route_(request) {
    switch (request.action) {
        case "LOAD_MONTH":
            return ApiController.loadMonth(
                request
            );

        case "SAVE_EXPENSE":
            return ApiController.saveExpense(
                request
            );

        case "PING":
            return ApiController.ping();

        default:
            return Response.error(
                "INVALID_ACTION",
                "Unknown action."
            );
    }
}