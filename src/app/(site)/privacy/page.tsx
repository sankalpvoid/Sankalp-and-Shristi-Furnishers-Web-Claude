import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
export const metadata: Metadata = { title: "Privacy note" };
export default function Privacy() {
  const s = getSettings();
  return (
    <div className="wrap prose" style={{ paddingBottom: 100 }}>
      <div className="page-head"><h1>Privacy note</h1></div>
      <div className="notice warn">Draft wording for the owner to review before launch. It describes what this website actually does; it is not legal advice.</div>
      <h2>What we collect</h2>
      <p>When you submit an enquiry or visit request we store the details you type into the form: your name, phone number, optional email, your message, and any product, saved-design reference, preferred date or shortlist you attach.</p>
      <p>When you save a design we store the options you chose and any notes. Saved designs do not include your contact details.</p>
      <h2>How we use it</h2>
      <p>{s.brand.name} uses these details only to respond to your request. Staff who sign in to our private dashboard can see them.</p>
      <h2>Your browser</h2>
      <p>Your shortlist is stored in your own browser (local storage) and is only sent to us if you choose to include it in a form. This website does not require an account.</p>
      <h2>Payments</h2>
      <p>This website does not take payments or payment details. Submitting a form does not place an order.</p>
      <h2>Questions</h2>
      <p>Ask the showroom team to correct or remove your details.</p>
    </div>
  );
}
