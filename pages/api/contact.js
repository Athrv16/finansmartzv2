import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, inquiryType, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px;">
        <h2 style="color: #2563eb; margin-bottom: 16px;">New Contact Form Submission</h2>
        <table style="width: 100%; font-size: 16px;">
          <tr><td style="font-weight: bold; color: #555;">Name:</td><td>${name}</td></tr>
          <tr><td style="font-weight: bold; color: #555;">Email:</td><td>${email}</td></tr>
          <tr><td style="font-weight: bold; color: #555;">Phone:</td><td>${phone}</td></tr>
          <tr><td style="font-weight: bold; color: #555;">Inquiry Type:</td><td>${inquiryType}</td></tr>
        </table>
        <div style="margin-top: 24px;">
          <div style="font-weight: bold; color: #555; margin-bottom: 8px;">Message:</div>
          <div style="background: #f0f4ff; border-radius: 6px; padding: 16px; color: #333;">${message}</div>
        </div>
      </div>
      <div style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">FinanSmartz Contact Form</div>
    </div>
  `;

  const mailOptions = {
    from: email,
    to: process.env.GMAIL_USER,
    subject: `Contact Form Submission from ${name}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
