export function validateCustomerForm(form: {
  company_name: string;
  contact_name: string;
  email: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.company_name.trim()) errors.company_name = 'Company name is required.';
  if (!form.contact_name.trim()) errors.contact_name = 'Contact name is required.';
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  return errors;
}

export function validateTicketForm(form: {
  customer_id: number;
  title: string;
  description: string;
  priority: string;
  category: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.customer_id) errors.customer_id = 'Please select a customer.';
  if (!form.title.trim()) errors.title = 'Ticket title is required.';
  if (!form.description.trim()) errors.description = 'Description is required.';
  if (!form.priority) errors.priority = 'Priority is required.';
  if (!form.category) errors.category = 'Category is required.';
  return errors;
}
