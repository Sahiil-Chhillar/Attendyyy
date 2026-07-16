// const nodemailer = require("nodemailer");

// const sendEmail = async ({ to, subject, html }) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: `"Attendyy" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     html,
//   });
// };

// module.exports = sendEmail;

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from: "Attendyy <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }

  return data;
};

module.exports = sendEmail;