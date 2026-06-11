import { Router } from 'express';
import * as customers from '../controllers/customersController';
import * as tickets from '../controllers/ticketsController';
import * as comments from '../controllers/commentsController';
import * as onboarding from '../controllers/onboardingController';
import * as articles from '../controllers/articlesController';
import * as dashboard from '../controllers/dashboardController';

const router = Router();

router.get('/dashboard', dashboard.getDashboard);

router.get('/customers', customers.getCustomers);
router.get('/customers/:id', customers.getCustomerById);
router.post('/customers', customers.createCustomer);
router.put('/customers/:id', customers.updateCustomer);
router.delete('/customers/:id', customers.deleteCustomer);
router.post('/customers/:id/notes', customers.addCustomerNote);

router.get('/tickets', tickets.getTickets);
router.get('/tickets/:id', tickets.getTicketById);
router.post('/tickets', tickets.createTicket);
router.put('/tickets/:id', tickets.updateTicket);
router.delete('/tickets/:id', tickets.deleteTicket);

router.get('/tickets/:id/comments', comments.getComments);
router.post('/tickets/:id/comments', comments.createComment);

router.get('/onboarding', onboarding.getAllOnboarding);
router.get('/customers/:id/onboarding', onboarding.getOnboardingByCustomer);
router.put('/onboarding/:taskId', onboarding.updateOnboardingTask);

router.get('/articles', articles.getArticles);
router.get('/articles/:id', articles.getArticleById);
router.post('/articles', articles.createArticle);
router.put('/articles/:id', articles.updateArticle);
router.delete('/articles/:id', articles.deleteArticle);

export default router;
