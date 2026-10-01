import MongoClientRepository from "../repository/ClientRepository.js"
import MongoApiKeyRepository from "../repository/ApiKeyRepository.js"
import MongoUserRepository from "../../auth/repository/UserRepository.js";
import { ClientService } from "../service/clientService.js";
import { ClientController } from "../controller/clientController.js";
import authContainer from "../../auth/Dependencies/dependencies.js"
import processorContainer from "../../processor/Dependency/dependencies.js";

/**
 * Container class to initialize and manage dependencies for the client service
 * This class is responsible for creating instances of repositories, services, and controllers, and ensuring that all dependencies are properly injected. It provides a centralized location for managing the dependencies of the client service, making it easier to maintain and scale the application.
 */
class Container {
    /**
     * Initialize the container by creating instances of repositories, services, and controllers
     * @returns {Object} - An object containing the initialized repositories, services, and controllers
     */
    static init() {
        // Initialize repositories
        const repositories = {
            clientRepository: MongoClientRepository,
            apiKeyRepository: MongoApiKeyRepository,
            userRepository: MongoUserRepository,
            apiHitRepository: processorContainer.repositories.apiHitRepository,
        };

        // Initialize services with the required dependencies
        const services = {
            clientServices: new ClientService({
                clientRepository: repositories.clientRepository,
                apiKeyRepository: repositories.apiKeyRepository,
                userRepository: repositories.userRepository,
                apiHitRepository: repositories.apiHitRepository,
            })
        };

        // Initialize controllers with the required dependencies
        const controller = {
            clientController: new ClientController(services.clientServices, authContainer.services.authService)
        };

        return { repositories, services, controller }
    }
}

const initialized = Container.init();
export { Container };
export default initialized;