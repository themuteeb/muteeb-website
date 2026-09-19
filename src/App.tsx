import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CapabilityMatrix from './components/CapabilityMatrix'
import Capacity from './components/Capacity'
import Processes from './components/Processes'
import Quality from './components/Quality'
import Sectors from './components/Sectors'
import HowToQuote from './components/HowToQuote'
import Production from './components/Production'
import MachineList from './components/MachineList'
import QuoteForm from './components/QuoteForm'
import Footer from './components/Footer'
import MobileQuoteBar from './components/MobileQuoteBar'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <CapabilityMatrix />
        <Capacity />
        <Processes />
        <Quality />
        <Sectors />
        <HowToQuote />
        <Production />
        <MachineList />
        <QuoteForm />
      </main>
      <Footer />
      <MobileQuoteBar />
    </div>
  )
}
