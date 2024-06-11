import { ConfirmSubscription } from "@/emails";
import supabaseAdmin from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { origin } = new URL(req.url);
  const { email } = (await req.json()) as { email: string };

  if (!email) {
    console.log("Email is missing in request");
    return NextResponse.json(
      {
        message: "Email is required.",
      },
      {
        status: 422,
      }
    );
  } else if (!email.endsWith("@gmail.com") && !email.endsWith("@outlook.com")) {
    console.log("Unsupported email domain:", email);
    return NextResponse.json(
      {
        message: "Support only @gmail,@outlook",
      },
      {
        status: 400,
      }
    );
  }

  const { data: existEmail } = await supabaseAdmin
    .from("email_list")
    .select("email")
    .eq("email", email)
    .single();

  if (existEmail) {
    console.log("Email already subscribed:", email);
    return NextResponse.json(
      {
        message: "Email is already subscribed.",
      },
      {
        status: 400,
      }
    );
  }

  const { data, error } = await generateMagicLink(email, origin);

  if (error) {
    console.log("Error generating magic link:", error);
    return NextResponse.json(
      {
        message: error.message,
      },
      {
        status: 400,
      }
    );
  } else {
    const emailRes = await sendMail(data.properties.action_link, email);

    if (emailRes.error) {
      console.log("Error sending email:", emailRes.error);
      return NextResponse.json(
        {
          message: "Fail to send email",
        },
        {
          status: 400,
        }
      );
    } else {
      return NextResponse.json({ message: "Please check your inbox" });
    }
  }
}

async function generateMagicLink(email: string, origin: string) {
  const supabase = supabaseAdmin;
  return await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: email,
    options: {
      redirectTo: origin + "/check",
    },
  });
}

async function sendMail(verifyLink: string, email: string) {
  const resend = new Resend(process.env.RESEND_KEY);
  return await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: email,
    subject: "Confirm Subscription",
    react: ConfirmSubscription({ verifyLink }),
  });
}
