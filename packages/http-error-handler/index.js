const { jsonSafeParse, normalizeHttpResponse } = require('@middy/util')

const defaults = {
  logger: console.error,
  fallbackMessage: null
}

const httpErrorHandlerMiddleware = (opts = {}) => {
  const options = { ...defaults, ...opts }

  const httpErrorHandlerMiddlewareOnError = async (request) => {
    if (typeof options.logger === 'function') {
      options.logger(request.error)
    }

    // Set default expose value, only passes in when there is an override
    if (request.error?.statusCode && request.error?.expose === undefined) {
      request.error.expose = request.error.statusCode < 500
    }

    // Non-http error OR expose set to false
    if (
      options.fallbackMessage &&
      (!request.error?.statusCode || !request.error?.expose)
    ) {
      request.error = {
        statusCode: 500,
        message: options.fallbackMessage,
        expose: true
      }
    }

    if (request.error?.expose) {
      request.response = normalizeHttpResponse(request.response)
      request.response.statusCode = request.error?.statusCode
      request.response.body = jsonSafeParse(request.error?.message)
      request.response.headers['Content-Type'] =
        typeof request.response?.body === 'string'
          ? 'plain/text'
          : 'application/json'

      return request.response
    }
  }

  return {
    onError: httpErrorHandlerMiddlewareOnError
  }
}
module.exports = httpErrorHandlerMiddleware
