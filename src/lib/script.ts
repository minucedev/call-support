export interface Step {
  kind: 'say' | 'ask' | 'hint'
  text: string
  /** Which Y/N answer this question records. */
  field?: 'night' | 'laptop' | 'mip'
}

export interface Section {
  title: string
  optional?: boolean
  steps: Step[]
}

// {name} = applicant name, {me} = caller name
export const SCRIPT: Section[] = [
  {
    title: 'Opening',
    steps: [
      { kind: 'say', text: 'Hi {name}, this is {me} calling from Sending.ac regarding your application for the L1 Sales & Support position.' },
      { kind: 'say', text: 'I just wanted to follow up on your application and ask you a few quick questions before we move forward to the next step. Is now a good time?' },
    ],
  },
  {
    title: 'Screening',
    steps: [
      { kind: 'ask', field: 'night', text: 'First, are you comfortable working a night shift schedule?' },
      { kind: 'ask', field: 'laptop', text: 'And do you have your own laptop or computer that you can use for work?' },
      { kind: 'say', text: 'Great. To start, can you tell me a little bit about yourself and your previous work experience?' },
      { kind: 'hint', text: 'Just listen, hear if they have a valid background' },
      { kind: 'say', text: "Since communication is an important part of this role, I'd also like to ask you a quick situational question. Can you tell me about a difficult customer you've handled before and how you dealt with the situation?" },
      { kind: 'hint', text: 'Just listen, hear if they have the rigor' },
    ],
  },
  {
    title: 'LinkedIn / MIP (optional, only if you know this)',
    optional: true,
    steps: [
      { kind: 'say', text: 'I also noticed that we asked you to provide your LinkedIn profile. Let me quickly explain why.' },
      { kind: 'say', text: "We have a program called the Managed Influencer Program, or MIP. Basically, if you have a LinkedIn account that you're not actively using, we may use it to build a profile around a specific topic or industry." },
      { kind: 'say', text: 'We can use the profile to connect with people, share content, and grow its followers over time. In return, you can earn money by allowing us to use your profile. And if the profile grows enough, there may also be an opportunity for you to become an influencer and earn more.' },
      { kind: 'ask', field: 'mip', text: "So, we just want to know if you're currently using your LinkedIn account actively. And if you're not, would you be comfortable with us considering your profile for the MIP?" },
    ],
  },
  {
    title: 'Closing',
    steps: [
      { kind: 'say', text: "Thanks, {name}. I really appreciate you taking the time to speak with me today. We'll review your interview, introduction video, LinkedIn profile, and overall experience. If we feel there's a good fit, we'll reach out to you regarding the next step." },
      { kind: 'say', text: 'Before we end, do you have any questions for me about the role or the company?' },
    ],
  },
]

export const fill = (text: string, name: string, me: string) =>
  text.replace(/\{name\}/g, name || '[Name]').replace(/\{me\}/g, me || '[Your Name]')
