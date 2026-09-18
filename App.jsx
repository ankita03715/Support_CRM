import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newNote, setNewNote] = useState("");
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    subject: "",
    description: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(
        `https://support-crm-bh6g.onrender.com/api/tickets?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`
      )
        .then((response) => response.json())
        .then((data) => {
          setTickets(data);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, status]);

  const createTicket = () => {
    fetch("https://support-crm-bh6g.onrender.com/api/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then(() => {
        setShowForm(false);

        setFormData({
          customer_name: "",
          customer_email: "",
          subject: "",
          description: "",
        });

        fetch(
          `https://support-crm-bh6g.onrender.com/api/tickets?search=${search}&status=${status}`
        )
          .then((response) => response.json())
          .then((data) => {
            setTickets(data);
          });
      });
  };      
    
  const viewTicket = (ticketId) => {
    fetch(`https://support-crm-bh6g.onrender.com/api/tickets/${ticketId}`)
      .then((response) => response.json())
      .then((data) => {
        setSelectedTicket(data);
      });
  };

  const updateTicket = () => {
    fetch(
      `https://support-crm-bh6g.onrender.com/api/tickets/${selectedTicket.ticket_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus || selectedTicket.status,
          notes: newNote,
        }),
      }
    )
      .then((response) => response.json())
      .then(() => {
        setSelectedTicket({
          ...selectedTicket,
          status: newStatus || selectedTicket.status,
        });

        setNewStatus("");
        setNewNote("");
      });
  };


  return (
    <div className="crm-container">

      <div className="crm-header">
        <h1>Support CRM</h1>
        <p>Manage customer support tickets</p>
      </div>

      <div className="toolbar">

        <input
          className="search-input"
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="status-filter"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>
        <button
          className="create-button"
          onClick={() => setShowForm(true)}
        >
          Create Ticket
        </button>
      </div>

      {showForm && (
        <div className="ticket-form">
          <h2>Create New Ticket</h2>

          <div className="form-group">
            <input
              type="text"
              placeholder="Customer Name"
              value={formData.customer_name}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  customer_name: event.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Customer Email"
              value={formData.customer_email}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  customer_email: event.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Issue Title"
              value={formData.subject}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  subject: event.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <textarea
              placeholder="Issue Description"
              rows="5"
              value={formData.description}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  description: event.target.value,
                })
              }
            />
          </div>

          <div className="form-buttons">
            <button
              className="create-button"
              onClick={createTicket}
            >
              Submit Ticket
            </button>

            <button
              className="cancel-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}


      {selectedTicket && (
        <div className="ticket-details">
          <h2>Ticket Details</h2>

          <p>
            <strong>Ticket ID:</strong> {selectedTicket.ticket_id}
          </p>

          <p>
            <strong>Customer:</strong> {selectedTicket.customer_name}
          </p>

          <p>
            <strong>Email:</strong> {selectedTicket.customer_email}
          </p>

          <p>
            <strong>Subject:</strong> {selectedTicket.subject}
          </p>

          <p>
            <strong>Description:</strong> {selectedTicket.description}
          </p>

          <p>
            <strong>Status:</strong> {selectedTicket.status}
          </p>
          <select
            className="detail-status"
            value={newStatus || selectedTicket.status}
            onChange={(event) => setNewStatus(event.target.value)}
          >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
          </select>

          <h3>Notes</h3>
          {selectedTicket.notes.length === 0 ? (
            <p>No notes yet.</p>
          ) : (
            selectedTicket.notes.map((note, index) => (
              <p key={index}>
                {note.note_text}
              </p>
            ))
          )}
          <textarea
            className="note-input"
            placeholder="Add a note..."
            rows="4"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
          />
    
          <button
            className="update-button"
            onClick={updateTicket}
          >
            Update Ticket
          </button>
    
          <button
            className="cancel-button"
            onClick={() => setSelectedTicket(null)}
          >
            Close Details
          </button>
        </div>
      )}





        <div className="tickets-section">
          <h2>Tickets</h2>

          <div className="ticket-list">

            <div className="ticket-header">
              <span>Ticket ID</span>
              <span>Customer</span>
              <span>Subject</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            {tickets.map((ticket) => (
              <div className="ticket-row" key={ticket.ticket_id} onClick={() => viewTicket(ticket.ticket_id)}>
                <span>{ticket.ticket_id}</span>
                <span>{ticket.customer_name}</span>
                <span>{ticket.subject}</span>
                <span className={`status-badge ${ticket.status.toLowerCase().replace(" ", "-")}`}>
                  {ticket.status}
                </span>
                <span>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}

          </div>

        </div>

    </div>
  );
   

}

export default App;
