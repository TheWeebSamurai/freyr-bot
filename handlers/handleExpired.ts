import ticketmodel from "../models/ticketmodel"
import path from "path"
import fs from "fs"
import chalk from "chalk"
import cron from "node-cron"

export default async function handleExpired() {
  const tickets = await ticketmodel.find({
    transcript_expiry: { $lte: Date.now() },
    transcript_expired: false
  })

  if (!tickets.length) return

  for (const ticket of tickets) {
    const transcriptPath = path.join( process.cwd(),"transcripts", `${ticket.ticket_id}.html`)

    if (!fs.existsSync(transcriptPath)) {
      console.log(chalk.red(`[Expiry Handler] ${transcriptPath} doesn't exist`))
      ticket.transcript_expired = true
      continue
    }

    try {
      fs.unlinkSync(transcriptPath)
      console.log(chalk.green(`[Expiry Handler] Deleted ${transcriptPath}`))
      ticket.transcript_expired = true
    } catch (err) {
      console.error(err)
    }
  }

  await ticketmodel.bulkSave(tickets)
}

cron.schedule("*/10 * * * *", () => {
    handleExpired().catch(console.error)
})
