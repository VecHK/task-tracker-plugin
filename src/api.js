import { Client } from '@notionhq/client'

let notion = new Client({
  auth: '',
})

export async function startSync({
	TOKEN,
	TRACKER_DATABASE_ID,
}) {
	notion = new Client({
		auth: TOKEN,
	})

	console.log('start refreshParent')
  await refreshParent(TRACKER_DATABASE_ID)

	console.log('start refreshSub')
  await refreshSub(TRACKER_DATABASE_ID)

	console.log('start refreshDoneDate')
	await refreshDoneDate(TRACKER_DATABASE_ID)

	console.log('start refreshStatus')
	await refreshStatus(TRACKER_DATABASE_ID)

	console.log('synced')
}

async function refreshParent(database_id) {
  // debugger;
  const res = await notion.databases.query({
    database_id,
    filter: {
      and: [
        {
          property: "Need Sync",
          checkbox: { equals: true }
        },
        {
          property: "Parent task",
          relation: { is_empty: true }
        }
      ]
    },
  })

  for (const page of res.results) {
    await notion.pages.update({
      page_id: page.id,
      properties: {
        Name: {
          title: [{
            text: {
              content: page.properties._Name.formula.string
            }
          }]
        }
      }
    })
  }
}

async function refreshSub(database_id) {
  const res = await notion.databases.query({
    database_id,
    filter: {
      and: [
				{
					property: "Done Date",
					date: { is_empty: true }
				},
        {
          property: "Parent task",
          relation: { is_not_empty: true }
        }
      ]
    },
  })

	console.log('will update sub count:', res.results)

  // return console.log(JSON.stringify(res))

  for (const page of res.results) {
    const properties = {
    }

    const mention_title_node = page.properties.Name.title.find(title_node => {
      return title_node.type === 'mention'
    })
    if (mention_title_node) {
      // console.log(mention_title_node.mention.date)
      const d = new Date(mention_title_node.mention.date.start)
      // d.setMinutes(0)
      // d.setHours(0)
      console.log(d)
      properties["Done Date"] = {
        // date: { start: d.toISOString() }
        date: mention_title_node.mention.date
        // date: mention_title_node.mention.date
      }

			const text_nodes = page.properties.Name.title.filter(title_node => {
				return title_node.type === 'text'
			})
			const title_text = text_nodes.map(text_node => text_node.plain_text).join('').trim()

			await notion.pages.update({
				page_id: page.id,
				properties: {
					Name: {
						title: [
							{
								text: {
									content: title_text
								}
							}
						]
					},
					...properties,
				}
			})
    }
  }

  // console.log(`${res.results.length} refreshed. ${(new Date()).toISOString()}`)
}

async function refreshDoneDate(database_id) {
	const res = await notion.databases.query({
    database_id,
    filter: {
      and: [
        {
          property: "Need Sync Done Date",
          checkbox: { equals: true }
        }
      ]
    },
  })

	for (const page of res.results) {
		// console.log('page', page)
		const date = page.properties['R_精神世界_DoneDate'].rollup.array[0].date
		await notion.pages.update({
			page_id: page.id,
			properties: {
				"Done Date": { date },
				Status: {
					status: { name: "Done" }
				},
			}
		})
	}
}

async function refreshStatus(database_id) {
	const res = await notion.databases.query({
		database_id,
		filter: {
			and: [
				{
					property: "is_parent",
          checkbox: { equals: false }
				},
				{
          property: "Need Sync Status",
          checkbox: { equals: true }
        },
			]
		},
	})

	for (const page of res.results) {
		const parent_status = page.properties.R_parent_status.rollup.array[0].status
		// console.log(parent_status)
		await notion.pages.update({
			page_id: page.id,
			properties: {
				Status: {
					status: parent_status
				},
			}
		})
	}
}
